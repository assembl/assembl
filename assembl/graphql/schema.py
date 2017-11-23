# -*- coding: utf-8 -*-
from collections import defaultdict
from datetime import datetime
import logging
import pytz
import os.path
from random import sample as random_sample

from sqlalchemy import desc, distinct, func, inspect, join, select
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.orm import contains_eager, joinedload, subqueryload, undefer
from sqlalchemy.sql.functions import count
import graphene
from graphene.pyutils.enum import Enum as PyEnum
from graphene.relay import Node
from graphene.types.scalars import Scalar
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene_sqlalchemy.converter import (
    convert_column_to_string, convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query, is_mapped
from graphql.utils.ast_to_dict import ast_to_dict
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from pyramid.i18n import TranslationStringFactory
from jwzthreading import restrip_pat

from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth import P_DELETE_POST, P_DELETE_MY_POST
from assembl.auth.util import get_permissions
from assembl.lib.sqla_types import EmailString
from assembl.lib.clean_input import sanitize_text, sanitize_html
from assembl.lib.locale import strip_country
from assembl import models
from assembl.models.post import countable_publication_states
from assembl.models.action import (
    SentimentOfPost,
    LikeSentimentOfPost, DisagreeSentimentOfPost,
    DontUnderstandSentimentOfPost, MoreInfoSentimentOfPost)
from assembl.models.auth import (
    LanguagePreferenceCollection, LanguagePreferenceCollectionWithDefault)
from assembl.nlp.translation_service import DummyGoogleTranslationService
from .types import SQLAlchemyInterface, SQLAlchemyUnion

_ = TranslationStringFactory('assembl')
convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)
models.Base.query = models.Base.default_db.query_property()

log = logging.getLogger('assembl')


class DateTime(Scalar):
    '''DateTime in ISO 8601 format'''

    @staticmethod
    def serialize(dt):
        return dt.replace(tzinfo=pytz.UTC).isoformat()

    @staticmethod
    def parse_literal(node):
        if isinstance(node, ast.StringValue):
            return datetime.strptime(
                node.value, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.UTC)

    @staticmethod
    def parse_value(value):
        return datetime.strptime(
            value, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.UTC)


class SecureObjectType(object):

    @classmethod
    def get_node(cls, id, context, info):
        try:
            result = cls.get_query(context).get(id)
        except NoResultFound:
            return None

        # The user can't retrieve a content from a different discussion
        discussion_id = context.matchdict['discussion_id']
        if result.discussion_id != discussion_id:
            raise HTTPUnauthorized()

        user_id = context.authenticated_userid or Everyone
        permissions = get_permissions(user_id, discussion_id)
        if not result.user_can(user_id, CrudPermissions.READ, permissions):
            raise HTTPUnauthorized()

        return result

# For security, always use only_fields in the Meta class to be sure we don't
# expose every fields and relations. You need at least only_fields = ('id', )
# to take effect.
# Auto exposing everything will automatically convert relations
# like AgentProfile.posts_created and create dynamically the
# object types Post, PostConnection which will conflict with those added
# manually.


# copied from https://github.com/graphql-python/graphene/issues/462#issuecomment-298218524
def collect_fields(node, fragments, variables):
    field = {}
    selection_set = node.get('selection_set') if node else None
    selections = selection_set.get('selections', None) if selection_set else None

    if selections is not None:
        for leaf in selections:
            leaf_kind = leaf.get('kind')
            leaf_name = leaf.get('name', {}).get('value')
            leaf_directives = leaf.get('directives')

            # Check if leaf should be skipped
            # - If name is '__typename'
            # - if @skip directive is used and evaluates to True
            # - if @include directive is used and evaluates to False (not yet implemented!)
            should_skip = False
            for directive in leaf_directives:
                if directive.get('name', {}).get('value') == 'skip':
                    for arg in directive.get('arguments', []):
                        arg_value = arg.get('value', {})
                        if arg.get('name', {}).get('value') == 'if':
                            if arg_value.get('kind') == 'Variable':
                                var_name = arg_value.get('name', {}).get('value')
                                should_skip = variables.get(var_name, should_skip)
                            elif arg_value.get('kind') == 'BooleanValue':
                                should_skip = arg_value.get('value')

            if leaf_name != '__typename' and not should_skip:
                if leaf_kind == 'Field':
                    field.update({leaf_name: collect_fields(leaf, fragments, variables)})
                elif leaf_kind == 'FragmentSpread':
                    field.update(collect_fields(fragments[leaf_name], fragments, variables))
                elif leaf_kind == 'InlineFragment':
                    field.update(collect_fields(leaf, fragments, variables))
    return field


def get_fields(info):
    """Return a nested dict of the fields requested by a graphene resolver"""
    fragments = {}
    node = ast_to_dict(info.field_asts[0])

    for name, value in info.fragments.items():
        fragments[name] = ast_to_dict(value)

    fields = collect_fields(node, fragments, info.variable_values)
    return fields


def resolve_langstring(langstring, locale_code):
    """If locale_code is None, return the best lang based on user prefs,
    otherwise respect the locale_code to return the right translation.
    If no translation found, fallback to best lang behavior.
    """
    if langstring is None:
        return None

    entries = langstring.entries
    if not entries:
        return None

    try:
        if locale_code:
            closest = langstring.closest_entry(locale_code)
            if closest:
                return closest.value

            english = langstring.closest_entry('en')
            if english:
                return english.value

        return langstring.best_lang(
            LanguagePreferenceCollection.getCurrent(), False).value

    except Exception:
        # Anything that goes wrong with clean_input, return the original
        return langstring.first_original()


def resolve_langstring_entries(obj, attr):
    langstring = getattr(obj, attr, None)
    if langstring is None or langstring is models.LangString.EMPTY:
        return []

    entries = []
    for entry in sorted(langstring.entries, key=lambda e: e.locale_code):
        entries.append(
            LangStringEntry(
                locale_code=entry.locale.base_locale,
                error_code=entry.error_code,
                translated_from_locale_code=entry.locale.machine_translated_from,
                value=entry.value or '',
            )
        )

    return entries


def resolve_best_langstring_entries(langstring, target_locale=None):
    if langstring is None or langstring is models.LangString.EMPTY:
        return []

    entries = []
    if target_locale:
        entry = langstring.closest_entry(target_locale)
        if entry:
            entries.append(entry)
            if entry.is_machine_translated:
                entry = langstring.closest_entry(entry.locale.machine_translated_from, filter_errors=False)
                assert entry, "closest original entry not found"
                entries.append(entry)
        else:
            entries.append(langstring.first_original())
        return entries

    # use request's idea of target_locale
    lsentries = langstring.best_entries_in_request_with_originals()
    lp = LanguagePreferenceCollection.getCurrent()
    for entry in lsentries:
        entries.append(
            LangStringEntry(
                locale_code=entry.locale.base_locale,
                error_code=entry.error_code,
                translated_from_locale_code=entry.locale.machine_translated_from,
                supposed_understood=not lp.find_locale(
                    entry.locale.base_locale).translate_to_locale,
                value=entry.value or '',
            )
        )

    return entries


def langstring_from_input_entries(entries):
    """Return a LangString SA object based on GraphQL LangStringEntryInput entries.
    """
    if entries is not None and len(entries) > 0:
        langstring = models.LangString.create(
            entries[0]['value'],
            entries[0]['locale_code'])
        for entry in entries[1:]:
            locale_id = models.Locale.get_id_of(entry['locale_code'])
            langstring.add_entry(
                models.LangStringEntry(
                    langstring=langstring,
                    value=entry['value'],
                    locale_id=locale_id
                )
            )

        return langstring

    return None


def update_langstring_from_input_entries(obj, attr, entries):
    """Update langstring from getattr(obj, attr) based on GraphQL LangStringEntryInput entries.
    """
    if entries is None:
        return
    langstring = getattr(obj, attr, None)
    if langstring is None:
        new_langstring = langstring_from_input_entries(entries)
        if new_langstring is not None:
            setattr(obj, attr, new_langstring)
        return

    locales = set()
    for entry in entries:
        locales.add(entry['locale_code'])
        langstring.add_value(entry['value'], entry['locale_code'])
    for entry in langstring.non_mt_entries():
        if entry.locale_code not in locales:
            entry.is_tombstone = True

    if inspect(langstring).persistent:
        langstring.db.expire(langstring, ['entries'])
    langstring.db.flush()


class LangStringEntryFields(graphene.AbstractType):
    value = graphene.String(required=False)
    locale_code = graphene.String(required=True)


class LangStringEntry(graphene.ObjectType, LangStringEntryFields):
    translated_from_locale_code = graphene.String(required=False)
    supposed_understood = graphene.Boolean(required=False)
    error_code = graphene.Int(required=False)


class LangStringEntryInput(graphene.InputObjectType, LangStringEntryFields):
    pass


sentiments_enum = PyEnum('SentimentTypes', (
    ('LIKE', 'LIKE'),
    ('DISAGREE', 'DISAGREE'),
    ('DONT_UNDERSTAND', 'DONT_UNDERSTAND'),
    ('MORE_INFO', 'MORE_INFO')))
SentimentTypes = graphene.Enum.from_enum(sentiments_enum)


publication_states_enum = PyEnum('PublicationStates',
    [(k, k) for k in models.PublicationStates.values()])
PublicationStates = graphene.Enum.from_enum(publication_states_enum)


class AgentProfile(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.AgentProfile
        interfaces = (Node, )
        only_fields = ('id', 'name')

    user_id = graphene.Int(required=True)

    def resolve_user_id(self, args, context, info):
        return self.id


# class User(AgentProfile):
#     class Meta:
#         model = models.User
#         interfaces = (Node, )
#         only_fields = ('id', 'name')  # preferredEmail


class SentimentCounts(graphene.ObjectType):
    dont_understand = graphene.Int()
    disagree = graphene.Int()
    like = graphene.Int()
    more_info = graphene.Int()


class Extract(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Extract
        interfaces = (Node, )
        only_fields = ('id', 'body', 'important')


class LocalePreference(graphene.ObjectType):
    locale = graphene.String()
    name = graphene.String(in_locale=graphene.String(required=True))
    native_name = graphene.String()

    def resolve_name(self, args, context, info):
        in_locale = args.get('in_locale') or None
        locale_model = models.Locale.get_or_create(in_locale)

        name = models.LocaleLabel.names_of_locales_in_locale([self.locale],
                                                             locale_model)
        if not name:
            # If the locale label does not exist, fallback on English
            locale_model = models.Locale.get_or_create('en')
            name = models.LocaleLabel.names_of_locales_in_locale([self.locale],
                                                                 locale_model)

        return name[self.locale]

    def resolve_native_name(self, args, context, info):
        locale = self.locale
        if locale == 'zh_Hans':  # we have the native name only for zh
            locale = 'zh'

        locale_model = models.Locale.get_or_create(locale)
        name = models.LocaleLabel.names_of_locales_in_locale([locale],
                                                             locale_model)
        if not name:
            # If the locale label does not exist, fallback on English
            locale_model = models.Locale.get_or_create('en')
            name = models.LocaleLabel.names_of_locales_in_locale([locale],
                                                                 locale_model)

        return name[locale]


class DiscussionPreferences(graphene.ObjectType):
    languages = graphene.List(LocalePreference)


class IdeaContentLink(graphene.ObjectType):
    idea_id = graphene.Int()
    post_id = graphene.Int()
    creator_id = graphene.Int()
    type = graphene.String(required=True)
    idea = graphene.Field(lambda: Idea)
    post = graphene.Field(lambda: Post)
    creator = graphene.Field(lambda: AgentProfile)
    creation_date = DateTime()

    def resolve_idea(self, args, context, info):
        if self.idea_id is not None:
            idea = models.Idea.get(self.idea_id)
            if type(idea) == models.Idea:  # only resolve if it's an Idea, not a Question
                return idea

    def resolve_post(self, args, context, info):
        if self.post_id is not None:
            return models.Post.get(self.post_id)

    def resolve_creator(self, args, context, info):
        if self.creator_id is not None:
            return models.AgentProfile.get(self.creator_id)


class Document(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Document
        only_fields = ('id', 'title', 'mime_type')

    external_url = graphene.String()


class PostAttachment(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.PostAttachment
        only_fields = ('id',)

    document = graphene.Field(Document)


class ResourcesCenter(graphene.ObjectType):

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    header_image = graphene.Field(Document)

    def resolve_title(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return resolve_langstring(discussion.resources_center_title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return resolve_langstring_entries(discussion, 'resources_center_title')

    def resolve_header_image(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        for attachment in discussion.attachments:
            if attachment.attachmentPurpose == 'RESOURCES_CENTER_HEADER_IMAGE':
                return attachment.document


class PostInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Post
        only_fields = ('creator', 'message_classifier')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    creation_date = DateTime()
    modification_date = DateTime()
    subject = graphene.String(lang=graphene.String())
    body = graphene.String(lang=graphene.String())
    subject_entries = graphene.List(LangStringEntry, lang=graphene.String())
    body_entries = graphene.List(LangStringEntry, lang=graphene.String())
    sentiment_counts = graphene.Field(SentimentCounts)
    my_sentiment = graphene.Field(type=SentimentTypes)
    indirect_idea_content_links = graphene.List(IdeaContentLink)
    extracts = graphene.List(Extract)
    parent_id = graphene.ID()
    body_mime_type = graphene.String(required=True)
    publication_state = graphene.Field(type=PublicationStates)
    attachments = graphene.List(PostAttachment)
    original_locale = graphene.String()

    def resolve_subject(self, args, context, info):
        # Use self.subject and not self.get_subject() because we still
        # want the subject even when the post is deleted.
        subject = resolve_langstring(self.subject, args.get('lang'))
        return subject

    def resolve_body(self, args, context, info):
        body = resolve_langstring(self.get_body(), args.get('lang'))
        return body

    @staticmethod
    def _maybe_translate(post, locale, request):
        if request.authenticated_userid == Everyone:
            # anonymous cannot trigger translations
            return
        if locale:
            lpc = LanguagePreferenceCollectionWithDefault(locale)
        else:
            lpc = LanguagePreferenceCollection.getCurrent(request)
        for ls in (post.body, post.subject):
            source_locale = ls.first_original().locale_code
            pref = lpc.find_locale(source_locale)
            target_locale = pref.translate_to_locale
            if not target_locale:
                continue
            target_locale = target_locale.code
            if not ls.closest_entry(target_locale):
                post.maybe_translate(lpc)

    def resolve_subject_entries(self, args, context, info):
        # Use self.subject and not self.get_subject() because we still
        # want the subject even when the post is deleted.
        PostInterface._maybe_translate(self, args.get('lang'), context)
        subject = resolve_best_langstring_entries(
            self.subject, args.get('lang'))
        return subject

    def resolve_body_entries(self, args, context, info):
        PostInterface._maybe_translate(self, args.get('lang'), context)
        body = resolve_best_langstring_entries(
            self.get_body(), args.get('lang'))
        return body

    def resolve_sentiment_counts(self, args, context, info):
        # get the sentiment counts from the cache if it exists instead of
        # tiggering a sql query
        cache = getattr(context, 'sentiment_counts_by_post_id', None)
        if cache is not None:
            sentiment_counts = {
                name: 0 for name in models.SentimentOfPost.all_sentiments
            }
            sentiment_counts.update(cache[self.id])
        else:
            sentiment_counts = self.sentiment_counts

        return SentimentCounts(
            dont_understand=sentiment_counts['dont_understand'],
            disagree=sentiment_counts['disagree'],
            like=sentiment_counts['like'],
            more_info=sentiment_counts['more_info'],
        )

    def resolve_my_sentiment(self, args, context, info):
        my_sentiment = self.my_sentiment
        if my_sentiment is None:
            return None

        return my_sentiment.name.upper()

    def resolve_indirect_idea_content_links(self, args, context, info):
        # example:
        #  {'@id': 'local:IdeaContentLink/101',
        #   '@type': 'Extract',
        #   'created': '2014-04-25T17:51:52Z',
        #   'idCreator': 'local:AgentProfile/152',
        #   'idIdea': 'local:Idea/52',
        #   'idPost': 'local:Content/1467'},
        # for @type == 'Extract', idIdea may be None
        # @type == 'IdeaRelatedPostLink' for idea links
        links = [IdeaContentLink(
                    idea_id=models.Idea.get_database_id(link['idIdea']),
                    post_id=models.Post.get_database_id(link['idPost']),
                    type=link['@type'],
                    creation_date=link['created'],
                    creator_id=link['idCreator'])
                 for link in self.indirect_idea_content_links_with_cache()]
        # only return links with the IdeaRelatedPostLink type
        return [link for link in links if link.type == 'IdeaRelatedPostLink']

    def resolve_parent_id(self, args, context, info):
        if self.parent_id is None:
            return None

        return Node.to_global_id('Post', self.parent_id)

    def resolve_body_mime_type(self, args, context, info):
        return self.get_body_mime_type()

    def resolve_publication_state(self, args, context, info):
        return self.publication_state.name

    def resolve_original_locale(self, args, context, info):
        entry = self.body.first_original()
        if entry:
            return entry.locale_code

        return u''


class Post(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Post
        interfaces = (Node, PostInterface)
        only_fields = ('id',)  # inherits fields from Post interface only


class PostConnection(graphene.Connection):
    class Meta:
        node = Post


class Video(graphene.ObjectType):
    title = graphene.String()
    description_top = graphene.String()
    description_bottom = graphene.String()
    description_side = graphene.String()
    html_code = graphene.String()
    title_entries = graphene.List(LangStringEntry)
    description_entries_top = graphene.List(LangStringEntry)
    description_entries_bottom = graphene.List(LangStringEntry)
    description_entries_side = graphene.List(LangStringEntry)


class Synthesis(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Synthesis
        interfaces = (Node, )
        only_fields = ('id', )

    subject = graphene.String(lang=graphene.String())
    subject_entries = graphene.List(LangStringEntry)
    introduction = graphene.String(lang=graphene.String())
    introduction_entries = graphene.List(LangStringEntry)
    conclusion = graphene.String(lang=graphene.String())
    conclusion_entries = graphene.List(LangStringEntry)
    ideas = graphene.List(lambda: IdeaUnion)
    img = graphene.Field(Document)
    creation_date = DateTime()

    def resolve_subject(self, args, context, info):
        return resolve_langstring(self.subject, args.get('lang'))

    def resolve_subject_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'subject')

    def resolve_introduction(self, args, context, info):
        return resolve_langstring(self.introduction, args.get('lang'))

    def resolve_introduction_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'introduction')

    def resolve_conclusion(self, args, context, info):
        return resolve_langstring(self.conclusion, args.get('lang'))

    def resolve_conclusion_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'conclusion')

    def resolve_ideas(self, args, context, info):
        return self.get_ideas()

    def resolve_img(self, args, context, info):
        ideas = self.get_ideas()
        last_idea = ideas[-1].live if ideas else None
        if last_idea.attachments:
            return last_idea.attachments[0].document



class IdeaInterface(graphene.Interface):
    num_posts = graphene.Int()
    num_contributors = graphene.Int()
    num_children = graphene.Int(identifier=graphene.String())
    img = graphene.Field(Document)
    order = graphene.Float()
    live = graphene.Field(lambda: IdeaUnion)
    message_view_override = graphene.String()

    def resolve_num_posts(self, args, context, info):
        if isinstance(self, models.RootIdea):
            # If this is RootIdea, do the sum of all children to be sure
            # we use the same counters that we see on each idea which are
            # based on countable states.
            # Don't use RootIdea.num_posts that give much higher count.
            return sum([child.num_posts for child in self.get_children()])

        return self.num_posts

    def resolve_img(self, args, context, info):
        if self.attachments:
            return self.attachments[0].document

    def resolve_order(self, args, context, info):
        return self.get_order_from_first_parent()

    def resolve_num_children(self, args, context, info):
        phase = args.get('identifier', '')
        if phase == 'multiColumns':
            _it = models.Idea.__table__
            _ilt = models.IdeaLink.__table__
            _target_it = models.Idea.__table__.alias()
            j = join(_ilt, _it, _ilt.c.source_id == _it.c.id
                ).join(_target_it, _ilt.c.target_id == _target_it.c.id)
            num = select([func.count(_ilt.c.id)]).select_from(j).where(
            (_ilt.c.tombstone_date == None)
            & (_it.c.tombstone_date == None)
            & (_it.c.id == self.id)
            & (_target_it.c.message_view_override == 'messageColumns')
            ).correlate_except(_ilt)
            return self.db.execute(num).fetchone()[0]

        return self.num_children


class IdeaAnnoucement(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.IdeaAnnouncement
        interfaces = (Node,)
        only_fields = ('id',)

    title = graphene.String(lang=graphene.String())
    body = graphene.String(lang=graphene.String())

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_body(self, args, context, info):
        return resolve_langstring(self.body, args.get('lang'))


class IdeaMessageColumn(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.IdeaMessageColumn
        interfaces = (Node,)
        only_fields = ('id', 'message_classifier', 'color')

    index = graphene.Int()
    idea = graphene.Field(lambda: Idea)
    name = graphene.String(lang=graphene.String())
    title = graphene.String(lang=graphene.String())
    header = graphene.String(lang=graphene.String())
    num_posts = graphene.Int()

    def resolve_idea(self, args, context, info):
        if self.idea:
            return self.idea

    def resolve_name(self, args, context, info):
        return resolve_langstring(self.name, args.get('lang'))

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_header(self, args, context, info):
        return resolve_langstring(self.header, args.get('lang'))

    def resolve_num_posts(self, args, context, info):
        related = self.idea.get_related_posts_query(
            partial=True, include_deleted=False)
        return models.Post.query.join(related, models.Post.id == related.c.post_id).\
            filter(models.Content.message_classifier == self.message_classifier).count()

    def resolve_index(self, args, context, info):
        count = self.get_positional_index()
        return count


class Idea(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Idea
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    # TODO: Look into seperating synthesis_title from 'What you need to know',
    # they mean different things
    synthesis_title = graphene.String(lang=graphene.String())  # This is the "What you need to know"
    description = graphene.String(lang=graphene.String())
    description_entries = graphene.List(LangStringEntry)
    children = graphene.List(lambda: Idea)
    parent_id = graphene.ID()
    posts = SQLAlchemyConnectionField(PostConnection)
    contributors = graphene.List(AgentProfile)
    announcement = graphene.Field(lambda: IdeaAnnoucement)
    message_columns = graphene.List(lambda: IdeaMessageColumn)
    ancestors = graphene.List(graphene.ID)

    @classmethod
    def is_type_of(cls, root, context, info):
        # This is the method defined in SQLAlchemyObjectType where
        # we changed the isinstance by a type comparison.
        # For a node query, graphql in
        # graphene/types/typemap.py(43)resolve_type()
        # which calls graphql/execution/executor.py(351)get_default_resolve_type_fn()
        # will try to know the object type from the SA object.
        # It actually iterate over all registered object types and return
        # the first one where is_type_of return True.
        # And here we have in the following order Idea, Question, Thematic.
        # So a node query on a Thematic or Question was returning the Idea object type.
        # Here we fix the issue by overriding the is_type_of method
        # for the Idea type to do a type comparison so that
        # models.Question/models.Thematic which
        # inherits from models.Idea doesn't return true
        if isinstance(root, cls):
            return True
        if not is_mapped(type(root)):
            raise Exception((
                'Received incompatible instance "{}".'
            ).format(root))
        # return isinstance(root, cls._meta.model)  # this was the original code
        return type(root) == cls._meta.model or type(root) == models.RootIdea

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_synthesis_title(self, args, context, info):
        return resolve_langstring(self.synthesis_title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        description = resolve_langstring(self.description, args.get('lang'))
        if not description:
            description = self.get_definition_preview()
        return description

    def resolve_description_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'description')

    def resolve_children(self, args, context, info):
        # filter on child.hidden to not include the root thematic in the children of root_idea
        return [child for child in self.get_children() if not child.hidden]

    def resolve_parent_id(self, args, context, info):
        parents = self.get_parents()
        if not parents:
            return None

        return Node.to_global_id('Idea', parents[0].id)

    def resolve_ancestors(self, args, context, info):
        return [Node.to_global_id('Idea', id)
                for id in self.get_all_ancestors(id_only=True)]

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        related = self.get_related_posts_query(partial=True, include_deleted=None)  # include_deleted=None means all posts (live and tombstoned)
        # The related query returns a list of (<PropositionPost id=2 >, None) instead of <PropositionPost id=2 > when authenticated, this is why we do another query here:
        Post = models.Post
        query = Post.query.join(
            related, Post.id == related.c.post_id
            ).order_by(desc(Post.creation_date), Post.id
            ).options(
                joinedload(Post.creator),
                undefer(Post.idea_content_links_above_post)
            )
        if len(discussion.discussion_locales) > 1:
            query = query.options(*models.Content.subqueryload_options())
        else:
            query = query.options(*models.Content.joinedload_options())

        # do only one sql query to calculate sentiment_counts
        # instead of doing one query for each post
        fields = get_fields(info)
        if 'sentimentCounts' in fields.get('edges', {}).get('node', {}):
            sentiment_counts = discussion.db.query(
                    models.Post.id, models.SentimentOfPost.type, count(models.SentimentOfPost.id)
                ).join(models.SentimentOfPost
                ).filter(models.Post.id.in_(query.with_entities(models.Post.id).subquery()),
                         models.SentimentOfPost.tombstone_condition()
                ).group_by(models.Post.id, models.SentimentOfPost.type)
            sentiment_counts_by_post_id = defaultdict(dict)
            for (post_id, sentiment_type, sentiment_count) in sentiment_counts:
                sentiment_counts_by_post_id[post_id][
                    sentiment_type[SentimentOfPost.TYPE_PREFIX_LEN:]
                ] = sentiment_count
            # set sentiment_counts_by_post_id on the request to use it
            # in Post's resolve_sentiment_counts
            context.sentiment_counts_by_post_id = sentiment_counts_by_post_id

        # pagination is done after that, no need to do it ourself
        return query

    def resolve_contributors(self, args, context, info):
        contributor_ids = [cid for (cid,) in self.get_contributors_query()]
        contributors = [models.AgentProfile.get(cid) for cid in contributor_ids]
        return contributors

    def resolve_announcement(self, args, context, info):
        return self.get_applicable_announcement()


class Question(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Question
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    posts = SQLAlchemyConnectionField(PostConnection, random=graphene.Boolean())

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        random = args.get('random', False)
        Post = models.Post
        related = self.get_related_posts_query(True)
        # If random is True returns 10 posts, the first one is the latest post created by the user,
        # then the remaining ones are in random order.
        # If random is False, return all the posts in creation_date desc order.
        if random:
            user_id = context.authenticated_userid
            if user_id is None:
                first_post = None
            else:
                first_post = Post.query.join(
                    related, Post.id == related.c.post_id
                    ).filter(Post.creator_id == user_id
                    ).order_by(desc(Post.creation_date), Post.id).first()

            query = Post.default_db.query(Post.id).join(
                related, Post.id == related.c.post_id)
            # retrieve ids, do the random and get the posts for these ids
            post_ids = [e[0] for e in query]
            limit = args.get('first', 10)
            if first_post is not None:
                first_post_id = first_post.id
                post_ids = [post_id for post_id in post_ids if post_id != first_post_id]
                limit -= 1

            random_posts_ids = random_sample(
                post_ids, min(len(post_ids), limit))
            query = Post.query.filter(Post.id.in_(random_posts_ids)
                ).options(
                    joinedload(Post.creator),
                )
            if len(discussion.discussion_locales) > 1:
                query = query.options(
                    models.LangString.subqueryload_option(Post.body))
            else:
                query = query.options(
                    models.LangString.joinedload_option(Post.body))

            if first_post is not None:
                query = [first_post] + query.all()

        else:
            # The related query returns a list of (<PropositionPost id=2 >, None) instead of <PropositionPost id=2 > when authenticated, this is why we do another query here:
            query = Post.query.join(
                related, Post.id == related.c.post_id
                ).filter(Post.publication_state == models.PublicationStates.PUBLISHED
                ).order_by(desc(Post.creation_date), Post.id
                ).options(
                    joinedload(Post.creator),
                )
            if len(discussion.discussion_locales) > 1:
                query = query.options(
                    models.LangString.subqueryload_option(Post.body))
            else:
                query = query.options(
                    models.LangString.joinedload_option(Post.body))

        # pagination is done after that, no need to do it ourself
        return query


class Thematic(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Thematic
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', 'identifier')

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    description = graphene.String(lang=graphene.String())
    questions = graphene.List(Question)
    video = graphene.Field(Video, lang=graphene.String())

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        return resolve_langstring(self.description, args.get('lang'))

    def resolve_questions(self, args, context, info):
        return self.get_children()

    def resolve_video(self, args, context, info):
        title = resolve_langstring(self.video_title, args.get('lang'))
        title_entries = resolve_langstring_entries(self, 'video_title')
        description_top = resolve_langstring(self.video_description_top,
                                             args.get('lang'))
        description_bottom = resolve_langstring(self.video_description_bottom,
                                                args.get('lang'))
        description_side = resolve_langstring(self.video_description_side,
                                              args.get('lang'))
        description_entries_top = resolve_langstring_entries(
            self, 'video_description_top')
        description_entries_bottom = resolve_langstring_entries(
            self, 'video_description_bottom')
        description_entries_side = resolve_langstring_entries(
            self, 'video_description_side')
        if not (title_entries or
                description_entries_top or
                description_entries_bottom or
                description_entries_side or self.video_html_code):
            return None

        return Video(
            title=title,
            title_entries=title_entries,
            description_top=description_top,
            description_bottom=description_bottom,
            description_side=description_side,
            description_entries_top=description_entries_top,
            description_entries_bottom=description_entries_bottom,
            description_entries_side=description_entries_side,
            html_code=self.video_html_code,
        )


class IdeaUnion(SQLAlchemyUnion):
    class Meta:
        types = (Idea, Thematic)
        model = models.Idea

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.Thematic): # must be above Idea
            return Thematic
        elif isinstance(instance, models.Idea):
            return Idea


class Locale(graphene.ObjectType):
    locale_code = graphene.String(required=True)
    label = graphene.String(required=True)


class Resource(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Resource
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    text = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    text_entries = graphene.List(LangStringEntry)
    embed_code = graphene.String()
    image = graphene.Field(Document)
    doc = graphene.Field(Document)

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_text(self, args, context, info):
        text = resolve_langstring(self.text, args.get('lang'))
        return text

    def resolve_text_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'text')

    def resolve_image(self, args, context, info):
        for attachment in self.attachments:
            if attachment.attachmentPurpose == 'IMAGE':
                return attachment.document

    def resolve_doc(self, args, context, info):
        for attachment in self.attachments:
            if attachment.attachmentPurpose == 'DOCUMENT':
                return attachment.document


class Query(graphene.ObjectType):
    node = Node.Field()
    root_idea = graphene.Field(IdeaUnion, identifier=graphene.String())
    ideas = graphene.List(Idea, identifier=graphene.String(required=True))
    thematics = graphene.List(Thematic,
                              identifier=graphene.String(required=True))
    syntheses = graphene.List(Synthesis)
    num_participants = graphene.Int()
    discussion_preferences = graphene.Field(DiscussionPreferences)
    default_preferences = graphene.Field(DiscussionPreferences)
    locales = graphene.List(Locale, lang=graphene.String(required=True))
    total_sentiments = graphene.Int()
    has_syntheses = graphene.Boolean()
    resources = graphene.List(Resource)
    resources_center = graphene.Field(lambda: ResourcesCenter)
    has_resources_center = graphene.Boolean()

    def resolve_resources(self, args, context, info):
        model = models.Resource
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        return query.filter(model.discussion_id == discussion_id)

    def resolve_has_resources_center(self, args, context, info):
        model = models.Resource
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        resources_count = query.filter(model.discussion_id == discussion_id).count()
        return bool(resources_count)

    def resolve_total_sentiments(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        query = discussion.db.query(models.SentimentOfPost
            ).filter(
                models.SentimentOfPost.tombstone_condition(),
                models.Content.tombstone_condition(),
                models.Post.id == models.Content.id,
                models.Post.publication_state.in_(countable_publication_states),
                *SentimentOfPost.get_discussion_conditions(discussion_id)
            )
        return query.count()

    def resolve_root_idea(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        identifier = args.get('identifier')
        if identifier is None or identifier == 'thread':
            return discussion.root_idea

        root_thematic = get_root_thematic_for_phase(discussion, identifier)
        return root_thematic

    def resolve_ideas(self, args, context, info):
        model = models.Idea
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        root_idea_id = discussion.root_idea.id
        descendants_query = model.get_descendants_query(
            root_idea_id, inclusive=True)
        query = query.outerjoin(
                models.Idea.source_links
            ).filter(model.id.in_(descendants_query)
            ).filter(
                model.hidden == False,
                model.sqla_type == 'idea'
            ).options(
                contains_eager(models.Idea.source_links),
                subqueryload(models.Idea.attachments).joinedload("document"),
#                subqueryload(models.Idea.message_columns),
                joinedload(models.Idea.title).joinedload("entries"),
#                joinedload(models.Idea.synthesis_title).joinedload("entries"),
                joinedload(models.Idea.description).joinedload("entries"),
            ).order_by(models.IdeaLink.order, models.Idea.creation_date)
        if args.get('identifier') == 'multiColumns':
            # Filter out ideas that don't have columns.
            query = query.filter(models.Idea.message_view_override == 'messageColumns')

        return query

    def resolve_thematics(self, args, context, info):
        identifier = args.get('identifier', None)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        root_thematic = get_root_thematic_for_phase(discussion, identifier)
        if root_thematic is None:
            return []

        return root_thematic.get_children()

    def resolve_syntheses(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return discussion.get_all_syntheses_query(include_unpublished=False).order_by(desc(models.Synthesis.creation_date))

    def resolve_has_syntheses(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        query = discussion.get_all_syntheses_query(include_unpublished=False)
        count = query.filter(
            models.Synthesis.is_next_synthesis != True).count()
        return True if count else False

    def resolve_num_participants(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return discussion.get_participants_query(
            ids_only=True, include_readers=True).count()

    def resolve_discussion_preferences(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        prefs = discussion.settings_json
        locales = prefs.get('preferred_locales', [])
        return DiscussionPreferences(
            languages=[LocalePreference(locale=x) for x in locales])

    def resolve_default_preferences(self, args, context, info):
        default = models.Preferences.get_default_preferences()
        preferred_locales = default['preferred_locales'] or []
        return DiscussionPreferences(
            languages=[LocalePreference(locale=x) for x in preferred_locales])

    def resolve_locales(self, args, context, info):
        locales = DummyGoogleTranslationService.target_localesC()
        target_locale = strip_country(models.Locale.get_or_create(args.get('lang')))
        labels = models.LocaleLabel.names_of_locales_in_locale(
            [strip_country(DummyGoogleTranslationService.asPosixLocale(loc)) for loc in locales],
            target_locale)
        return [Locale(locale_code=locale_code, label=label)
                for locale_code, label in sorted(labels.items(),
                                                 key=lambda entry: entry[1])]

    def resolve_resources_center(self, args, context, info):
        return ResourcesCenter()


class VideoInput(graphene.InputObjectType):
    title_entries = graphene.List(LangStringEntryInput)
    description_entries_top = graphene.List(LangStringEntryInput)
    description_entries_bottom = graphene.List(LangStringEntryInput)
    description_entries_side = graphene.List(LangStringEntryInput)
    html_code = graphene.String()


class QuestionInput(graphene.InputObjectType):
    id = graphene.ID()
    title_entries = graphene.List(LangStringEntryInput, required=True)


def get_root_thematic_for_phase(discussion, identifier):
    """Return root thematic for the given phase `identifier` on `discussion`.
    """
    root_thematic = [idea
                     for idea in discussion.root_idea.get_children()
                     if getattr(idea, 'identifier', '') == identifier]
    return root_thematic[0] if root_thematic else None


def create_root_thematic(discussion, identifier):
    """Create the root thematic (hidden) for the given phase `identifier`
    on `discussion`.
    """
    short_title = u'Phase {}'.format(identifier)
    root_thematic = models.Thematic(
        discussion_id=discussion.id,
        title=langstring_from_input_entries(
            [{'locale_code': 'en', 'value': short_title}]),
        identifier=identifier,
        hidden=True)
    discussion.root_idea.children.append(root_thematic)
    return root_thematic

# Create an Idea to be used in a Thread phase (and displayed in frontend version 1 or 2)
# Maybe some of its logic should be factorized with CreateThematic
# For now, we on purpose do not make use of an "identifier" input (identifier of the phase this idea will be visible in) like we would do in CreateThematic mutation, because behavior between frontend v1 and v2 has not yet been completely clarified.
class CreateIdea(graphene.Mutation):
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput)
        image = graphene.String()  # this is the identifier of the part in a multipart POST
        order = graphene.Float()
        parent_id = graphene.ID()

    idea = graphene.Field(lambda: Idea)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Idea
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception('Idea titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            description_langstring = langstring_from_input_entries(args.get('description_entries'))
            kwargs = {}
            if description_langstring is not None:
                kwargs['description'] = description_langstring


            parent_idea_id = args.get('parent_id')
            if parent_idea_id:
                    parent_idea_id = int(Node.from_global_id(parent_idea_id)[1])
                    if parent_idea_id:
                        parent_idea = models.Idea.get(parent_idea_id)
                        if not parent_idea:
                            raise Exception('Parent Idea not found')
                        if parent_idea.discussion != discussion:
                            # No cross-debate references are allowed, for security reasons
                            raise Exception('Parent Idea does not belong to this discussion')
                    else:
                        raise Exception('Parent Idea not found')
            if not parent_idea_id:
                parent_idea = discussion.root_idea

            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db = saobj.db
            db.add(saobj)
            order = len(parent_idea.get_children()) + 1.0
            db.add(
                models.IdeaLink(source=parent_idea, target=saobj,
                         order=args.get('order', order)))

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                attachment = models.IdeaAttachment(
                    document=document,
                    idea=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

        return CreateIdea(idea=saobj)


# How the file upload works
# With the https://github.com/jaydenseric/apollo-upload-client
# networkInterface, if there is a File object in a graphql variable, the File data
# is appended to the POST body as a part with an identifier starting with 'variables.',
# For example if we use 'img' File variable in a mutation,
# 'variables.img' will be available in context.POST, 'img' is removed from the
# variables in the json by apollo-upload-client, but graphql-wsgi put back
# {'img': 'variables.img'}
# in the variables, so here `image` input argument will be 'variables.img'
# (assuming assigning image: $img in the mutation)
class CreateThematic(graphene.Mutation):
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput)
        identifier = graphene.String(required=True)
        video = graphene.Argument(VideoInput)
        questions = graphene.List(QuestionInput)
        image = graphene.String()  # this is the identifier of the part in a multipart POST
        order = graphene.Float()

    thematic = graphene.Field(lambda: Thematic)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Thematic
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        identifier = args.get('identifier')
        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception('Thematic titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            description_langstring = langstring_from_input_entries(
                args.get('description_entries'))
            kwargs = {}
            if description_langstring is not None:
                kwargs['description'] = description_langstring

            video = args.get('video')
            if video is not None:
                video_title = langstring_from_input_entries(
                    video.get('title_entries', None))
                if video_title is not None:
                    kwargs['video_title'] = video_title

                video_description_top = langstring_from_input_entries(
                    video.get('description_entries_top', None))
                if video_description_top is not None:
                    kwargs['video_description_top'] = video_description_top

                video_description_bottom = langstring_from_input_entries(
                    video.get('description_entries_bottom', None))
                if video_description_bottom is not None:
                    kwargs[
                        'video_description_bottom'] = video_description_bottom

                video_description_side = langstring_from_input_entries(
                    video.get('description_entries_side', None))
                if video_description_side is not None:
                    kwargs[
                        'video_description_side'] = video_description_side

                video_html_code = video.get('html_code', None)
                if video_html_code is not None:
                    kwargs['video_html_code'] = video_html_code

            # Our thematic, because it inherits from Idea, needs to be
            # associated to the root idea of the discussion.
            # We create a hidden root thematic, corresponding to the
            # `identifier` phase, child of the root idea,
            # and add our thematic as a child of this root thematic.
            root_thematic = get_root_thematic_for_phase(discussion, identifier)
            if root_thematic is None:
                root_thematic = create_root_thematic(discussion, identifier)

            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                identifier=identifier,
                **kwargs)
            db = saobj.db
            db.add(saobj)
            order = len(root_thematic.get_children()) + 1.0
            db.add(
                models.IdeaLink(source=root_thematic, target=saobj,
                         order=args.get('order', order)))

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                attachment = models.IdeaAttachment(
                    document=document,
                    idea=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

            questions_input = args.get('questions')
            if questions_input is not None:
                for idx, question_input in enumerate(questions_input):
                    title_ls = langstring_from_input_entries(
                        question_input['title_entries'])
                    question = models.Question(
                        title=title_ls,
                        discussion_id=discussion_id
                    )
                    db.add(
                        models.IdeaLink(source=saobj, target=question,
                                        order=idx + 1.0))
                db.flush()

        return CreateThematic(thematic=saobj)


class UpdateThematic(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput)
        description_entries = graphene.List(LangStringEntryInput)
        identifier = graphene.String()
        video = graphene.Argument(VideoInput)
        questions = graphene.List(QuestionInput)
        image = graphene.String()  # this is the identifier of the part in a multipart POST
        order = graphene.Float()

    thematic = graphene.Field(lambda: Thematic)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Thematic
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        thematic_id = args.get('id')
        id_ = int(Node.from_global_id(thematic_id)[1])
        thematic = cls.get(id_)

        permissions = get_permissions(user_id, discussion_id)
        allowed = thematic.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            # introducing history at every step, including thematics + questions
            thematic.copy(tombstone=True)
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception('Thematic titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(thematic, 'title', title_entries)
            update_langstring_from_input_entries(thematic, 'description', args.get('description_entries'))
            kwargs = {}
            video = args.get('video', None)
            if video is not None:
                update_langstring_from_input_entries(
                    thematic, 'video_title', video.get('title_entries', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_top',
                    video.get('description_entries_top', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_bottom',
                    video.get('description_entries_bottom', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_side',
                    video.get('description_entries_side', []))
                kwargs['video_html_code'] = video.get('html_code', None)

            if args.get('identifier') is not None:
                kwargs['identifier'] = args.get('identifier')

            for attr, value in kwargs.items():
                setattr(thematic, attr, value)

            db = thematic.db

            # change order if needed
            order = args.get('order')
            if order:
                thematic.source_links[0].order = order

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                # if there is already an attachment, remove it with the
                # associated document (image)
                if thematic.attachments:
                    db.delete(thematic.attachments[0].document)
                    thematic.attachments.remove(thematic.attachments[0])

                attachment = models.IdeaAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )
                thematic.attachments.append(attachment)
            db.flush()

            questions_input = args.get('questions')
            existing_questions = {question.id: question for question in thematic.get_children()}
            updated_questions = set()
            if questions_input is not None:
                for idx, question_input in enumerate(questions_input):
                    if question_input.get('id', None) is not None:
                        id_ = int(Node.from_global_id(question_input['id'])[1])
                        updated_questions.add(id_)
                        question = models.Question.get(id_)
                        # archive the question
                        question.copy(tombstone=True)
                        update_langstring_from_input_entries(
                            question, 'title', question_input['title_entries'])
                        # modify question order
                        question.source_links[0].order = idx + 1.0
                    else:
                        title_ls = langstring_from_input_entries(
                            question_input['title_entries'])
                        question = models.Question(
                            title=title_ls,
                            discussion_id=discussion_id
                        )
                        db.add(
                            models.IdeaLink(source=thematic, target=question,
                                     order=idx + 1.0))

                # remove question (tombstone it) that are not in questions_input
                for question_id in set(existing_questions.keys()
                        ).difference(updated_questions):
                    existing_questions[question_id].is_tombstone = True

            db.flush()

        return UpdateThematic(thematic=thematic)


class DeleteThematic(graphene.Mutation):
    class Input:
        thematic_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        thematic_id = args.get('thematic_id')
        thematic_id = int(Node.from_global_id(thematic_id)[1])
        thematic = models.Thematic.get(thematic_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = thematic.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        thematic.is_tombstone = True
        thematic.db.flush()
        return DeleteThematic(success=True)


class CreatePost(graphene.Mutation):
    class Input:
        subject = graphene.String()
        body = graphene.String(required=True)
        idea_id = graphene.ID(required=True)
        parent_id = graphene.ID() # A Post (except proposals in survey phase) can reply to another post. See related code in views/api/post.py
        attachments = graphene.List(graphene.String)
        message_classifier = graphene.String()

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        idea_id = args.get('idea_id')
        idea_id = int(Node.from_global_id(idea_id)[1])
        in_reply_to_idea = models.Idea.get(idea_id)
        if isinstance(in_reply_to_idea, models.Question):
            cls = models.PropositionPost
        else:
            cls = models.AssemblPost

        in_reply_to_post = None
        if cls == models.AssemblPost:
            in_reply_to_post_id = args.get('parent_id')
            if in_reply_to_post_id:
                in_reply_to_post_id = int(Node.from_global_id(in_reply_to_post_id)[1])
                if in_reply_to_post_id:
                    in_reply_to_post = models.Post.get(in_reply_to_post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            subject = args.get('subject')
            body = args.get('body')
            classifier = args.get('message_classifier', None)
            body = sanitize_html(body)
            body_langstring = models.LangString.create(body)
            if subject:
                subject = sanitize_text(subject)
                subject_langstring = models.LangString.create(subject)
            elif issubclass(cls, models.PropositionPost):
                # Specific case first. Respect inheritance. Since we are using
                # a specific value, construct it with localization machinery.
                subject_langstring = models.LangString.create_localized_langstring(
                    _('Proposal'), discussion.discussion_locales, {'fr': 'Proposition'})
            else:  # We apply the same logic than in views/api/post.py::create_post
                locale = models.Locale.UNDEFINED
                if in_reply_to_post and in_reply_to_post.get_title():
                    original_subject = in_reply_to_post.get_title().first_original()
                    locale = original_subject.locale_code
                    subject = original_subject.value
                elif in_reply_to_idea:
                    # TODO: some ideas have extra langstring titles
                    subject = (in_reply_to_idea.title.first_original().value)
                    locale = discussion.main_locale
                else:
                    subject = discussion.topic if discussion.topic else ''
                    locale = discussion.main_locale

                if subject:
                    new_subject = u'Re: ' + restrip_pat.sub('', subject).strip()
                    if (in_reply_to_post and new_subject == subject and
                        in_reply_to_post.get_title()):
                        # reuse subject and translations
                        subject_langstring = in_reply_to_post.get_title().clone(discussion.db)
                    else:
                        subject_langstring = models.LangString.create(new_subject, locale)


            new_post = cls(
                discussion=discussion,
                subject=subject_langstring,
                body=body_langstring,
                creator_id=user_id,
                body_mime_type=u'text/html',
                message_classifier=classifier
            )
            new_post.guess_languages()
            db = new_post.db
            db.add(new_post)
            db.flush()
            if in_reply_to_post:
                new_post.set_parent(in_reply_to_post)
            elif in_reply_to_idea:
                # don't create IdeaRelatedPostLink when we have both
                # in_reply_to_post and in_reply_to_idea
                idea_post_link = models.IdeaRelatedPostLink(
                    creator_id=user_id,
                    content=new_post,
                    idea=in_reply_to_idea
                )
                db.add(idea_post_link)

            db.flush()
            new_post.db.expire(new_post, ['idea_content_links_above_post'])

            attachments = args.get('attachments', [])
            for document_id in attachments:
                document = models.Document.get(document_id)
                attachment = models.PostAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    post=new_post,
                    title=document.title,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

        return CreatePost(post=new_post)


class UpdatePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        subject = graphene.String()
        body = graphene.String(required=True)
        attachments = graphene.List(graphene.String)

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        cls = models.Post

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        changed = False
        subject = args.get('subject')
        if subject:
            subject = sanitize_text(subject)
        body = args.get('body')
        if body:
            body = sanitize_html(body)
        # TODO: Here, an assumption that the modification uses the same
        # language as the original. May need revisiting.
        original_subject_entry = post.subject.first_original()
        # subject is not required, be careful to not remove it if not specified
        if subject and subject != original_subject_entry.value:
            changed = True
            post.subject.add_value(subject, original_subject_entry.locale_code)
            # Edit subject for all descendants
            children = post.children[:]
            new_subject = u'Re: ' + restrip_pat.sub('', subject).strip()
            while children:
                child = children.pop()
                children.extend(child.children)
                child.subject.add_value(new_subject, child.subject.first_original().locale_code)

        original_body_entry = post.body.first_original()
        if body != original_body_entry.value:
            post.body.add_value(body, original_body_entry.locale_code)
            changed = True

            original_attachments = post.attachments
            original_attachments_doc_ids = []
            if original_attachments:
                original_attachments_doc_ids = [str(a.document_id) for a in original_attachments]

            attachments = args.get('attachments', [])
            for document_id in attachments:
                if document_id not in original_attachments_doc_ids:
                    document = models.Document.get(document_id)
                    models.PostAttachment(
                        document=document,
                        discussion=discussion,
                        creator_id=context.authenticated_userid,
                        post=post,
                        title=document.title,
                        attachmentPurpose="EMBED_ATTACHMENT"
                    )

            # delete attachments that has been removed
            documents_to_delete = set(original_attachments_doc_ids) - set(attachments)
            for document_id in documents_to_delete:
                with cls.default_db.no_autoflush:
                    document = models.Document.get(document_id)
                    post_attachment = post.db.query(
                        models.PostAttachment
                    ).filter_by(
                        discussion_id=discussion_id, post_id=post_id, document_id=document_id
                        ).first()
                    post.db.delete(document)
                    post.attachments.remove(post_attachment)
                    post.db.flush()

        if changed:
            post.modification_date = datetime.utcnow()
            post.body_mime_type = u'text/html'
            post.db.flush()
            post.db.expire(post.subject, ["entries"])
            post.db.expire(post.body, ["entries"])

        return UpdatePost(post=post)


class DeletePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        # Same logic as in assembl/views/api2/post.py:delete_post_instance
        # Remove extracts associated to this post
        extracts_to_remove = post.db.query(models.Extract).filter(models.Extract.content_id == post.id).all()
        for extract in extracts_to_remove:
            extract.delete()

        if user_id == post.creator_id and P_DELETE_MY_POST in permissions:
            cause = models.PublicationStates.DELETED_BY_USER
        elif P_DELETE_POST in permissions:
            cause = models.PublicationStates.DELETED_BY_ADMIN

        post.delete_post(cause)
        post.db.flush()
        return DeletePost(post=post)


class UndeletePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        post.undelete_post()
        post.db.flush()
        return UndeletePost(post=post)


class AddSentiment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        type = graphene.Argument(
            type=SentimentTypes,
            required=True
        )

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = SentimentOfPost.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        sentiment_type = args.get('type')
        if SentimentTypes.LIKE.name == sentiment_type:
            sentiment = LikeSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.DISAGREE.name == sentiment_type:
            sentiment = DisagreeSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.DONT_UNDERSTAND.name == sentiment_type:
            sentiment = DontUnderstandSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.MORE_INFO.name == sentiment_type:
            sentiment = MoreInfoSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)

        sentiment = sentiment.handle_duplication(
            permissions=permissions, user_id=user_id)
        sentiment.db.add(sentiment)
        sentiment.db.flush()
        return AddSentiment(post=post)


class DeleteSentiment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.my_sentiment.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        post.my_sentiment.is_tombstone = True
        post.db.flush()
        return DeleteSentiment(post=post)


class UploadDocument(graphene.Mutation):
    class Input:
        file = graphene.String(
            required=True
        )

    document = graphene.Field(lambda: Document)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone
        cls = models.Document
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        uploaded_file = args.get('file')
        if uploaded_file is not None:
            filename = os.path.basename(context.POST[uploaded_file].filename)
            mime_type = context.POST[uploaded_file].type
            uploaded_file = context.POST[uploaded_file].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            document.db.flush()

        return UploadDocument(document=document)


class AddPostAttachment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        file = graphene.String(
            required=True
        )

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        cls = models.PostAttachment
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        # add uploaded file as an attachment to the post
        attachment = args.get('file')
        if attachment is not None:
            filename = os.path.basename(context.POST[attachment].filename)
            mime_type = context.POST[attachment].type
            uploaded_file = context.POST[attachment].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)

            attachment = models.PostAttachment(
                document=document,
                discussion=discussion,
                creator_id=context.authenticated_userid,
                post=post,
                title=filename,
                attachmentPurpose="EMBED_ATTACHMENT"
            )
            post.db.flush()

        return AddPostAttachment(post=post)


class DeletePostAttachment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        attachment_id = graphene.Int(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        permissions = get_permissions(user_id, discussion_id)
        post_attachment_id = args.get('attachment_id')
        post_attachment = models.PostAttachment.get(post_attachment_id)
        allowed = post_attachment.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        cls = models.Post
        with cls.default_db.no_autoflush:
            post.db.delete(post_attachment.document)
            post.attachments.remove(post_attachment)

        post.db.flush()

        return DeletePostAttachment(post=post)


class UpdateDiscussionPreferences(graphene.Mutation):
    class Input:
        languages = graphene.List(graphene.String, required=True)

    preferences = graphene.Field(lambda: DiscussionPreferences)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Preferences
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()
        prefs_to_save = args.get('languages')
        if not prefs_to_save:
            raise Exception("Must pass at least one preference to be saved")

        discussion.discussion_locales = prefs_to_save
        discussion.db.flush()

        discussion_pref = DiscussionPreferences(
            languages=[LocalePreference(locale=x) for
                       x in discussion.discussion_locales])
        return UpdateDiscussionPreferences(preferences=discussion_pref)


class CreateResource(graphene.Mutation):
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        text_entries = graphene.List(LangStringEntryInput)
        embed_code = graphene.String()
        image = graphene.String()
        doc = graphene.String()

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Resource
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception('Resource titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            text_langstring = langstring_from_input_entries(
                args.get('text_entries'))
            kwargs = {}
            if text_langstring is not None:
                kwargs['text'] = text_langstring

            kwargs['embed_code'] = args.get('embed_code')
            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db = saobj.db
            db.add(saobj)

            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                image_attachment = models.ResourceAttachment(
                    document=document,
                    resource=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="IMAGE"
                )

            doc = args.get('doc')
            if doc is not None:
                filename = os.path.basename(context.POST[doc].filename)
                mime_type = context.POST[doc].type
                uploaded_file = context.POST[doc].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                doc_attachment = models.ResourceAttachment(
                    document=document,
                    resource=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="DOCUMENT"
                )


            db.flush()

        return CreateResource(resource=saobj)


class DeleteResource(graphene.Mutation):
    class Input:
        resource_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        resource_id = args.get('resource_id')
        resource_id = int(Node.from_global_id(resource_id)[1])
        resource = models.Resource.get(resource_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = resource.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        resource.db.delete(resource)
        resource.db.flush()
        return DeleteResource(success=True)


class UpdateResource(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput)
        text_entries = graphene.List(LangStringEntryInput)
        embed_code = graphene.String()
        image = graphene.String()
        doc = graphene.String()

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Resource
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        resource_id = args.get('id')
        resource_id = int(Node.from_global_id(resource_id)[1])
        resource = cls.get(resource_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = resource.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception('Resource titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(resource, 'title', title_entries)
            update_langstring_from_input_entries(resource, 'text', args.get('text_entries'))
            kwargs = {}
            kwargs['embed_code'] = args.get('embed_code', None)
            for attr, value in kwargs.items():
                setattr(resource, attr, value)

            db = resource.db

            # add uploaded image as an attachment to the resource
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                # if there is already an IMAGE, remove it with the
                # associated document
                images = [att for att in resource.attachments if att.attachmentPurpose == 'IMAGE']
                if images:
                    image = images[0]
                    db.delete(image.document)
                    resource.attachments.remove(image)

                attachment = models.ResourceAttachment(
                    document=document,
                    discussion=discussion,
                    resource=resource,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="IMAGE"
                )

        # add uploaded doc as an attachment to the resource
        doc = args.get('doc')
        if doc is not None:
            filename = os.path.basename(context.POST[doc].filename)
            mime_type = context.POST[doc].type
            uploaded_file = context.POST[doc].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            # if there is already a DOCUMENT, remove it with the
            # associated document
            docs = [att for att in resource.attachments if att.attachmentPurpose == 'DOCUMENT']
            if docs:
                doc = docs[0]
                db.delete(doc.document)
                resource.attachments.remove(doc)

            attachment = models.ResourceAttachment(
                document=document,
                discussion=discussion,
                resource=resource,
                creator_id=context.authenticated_userid,
                title=filename,
                attachmentPurpose="DOCUMENT"
            )

            db.flush()

        return UpdateResource(resource=resource)


class UpdateResourcesCenter(graphene.Mutation):
    class Input:
        title_entries = graphene.List(LangStringEntryInput)
        header_image = graphene.String()

    resources_center = graphene.Field(lambda: ResourcesCenter)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Discussion
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = discussion.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            db = discussion.db
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception('Resources center title entries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(discussion, 'resources_center_title', title_entries)

            # add uploaded image as an attachment to the discussion
            image = args.get('header_image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)

                # if there is already an IMAGE, remove it with the
                # associated document
                header_images = [att for att in discussion.attachments if att.attachmentPurpose == 'RESOURCES_CENTER_HEADER_IMAGE']
                if header_images:
                    header_image = header_images[0]
                    db.delete(header_image.document)
                    discussion.attachments.remove(header_image)

                attachment = models.DiscussionAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="RESOURCES_CENTER_HEADER_IMAGE"
                )

        db.flush()
        resources_center = ResourcesCenter()
        return UpdateResourcesCenter(resources_center=resources_center)


class Mutations(graphene.ObjectType):
    create_thematic = CreateThematic.Field()
    update_thematic = UpdateThematic.Field()
    delete_thematic = DeleteThematic.Field()
    create_idea = CreateIdea.Field()
    create_post = CreatePost.Field()
    update_post = UpdatePost.Field()
    delete_post = DeletePost.Field()
    undelete_post = UndeletePost.Field()
    add_sentiment = AddSentiment.Field()
    delete_sentiment = DeleteSentiment.Field()
    add_post_attachment = AddPostAttachment.Field()
    upload_document = UploadDocument.Field()
    delete_post_attachment = DeletePostAttachment.Field()
    update_discussion_preferences = UpdateDiscussionPreferences.Field()
    create_resource = CreateResource.Field()
    delete_resource = DeleteResource.Field()
    update_resource = UpdateResource.Field()
    update_resources_center = UpdateResourcesCenter.Field()


Schema = graphene.Schema(query=Query, mutation=Mutations)


def generate_schema_json_from_schema(schema, output='/tmp/schema.json'):
    import json
    schema_dict = schema.introspect()
    with open(output, 'w') as outfile:
        json.dump(schema_dict, outfile, indent=2)


def generate_schema_json():
    generate_schema_json_from_schema(Schema)


'''
$ pshell local.ini
import json
from assembl.graphql.schema import Schema as schema
from webtest import TestRequest
request = TestRequest.blank('/', method="POST")
request.matchdict = {"discussion_id": 6}
# take the first sysadmin:
userid = models.User.default_db.query(models.User).join(models.User.roles).filter(models.Role.id == 7)[0:1][0].id
request.authenticated_userid = userid

# and after that, execute a query or mutation....
# For mutations, see examples in tests/test_graphql.py (replace graphql_request by request)
# In pshell, you need to db.commit() if you want a mutation to be persistent.

#print the schema as text:
print str(schema)

#schema.execute returns a ExecutionResult object with data and errors attributes on it.

#get node:
print json.dumps(schema.execute('query { node(id:"UG9zdDoyMzU5") { ... on Post { id, creator { name } } } }', context_value=request).data, indent=2)

# get posts for a specific idea:
print json.dumps(schema.execute('query { node(id:"SWRlYToyNDU0") { ... on Idea { id, posts { edges { node { ... on PostInterface { subject, body, creationDate, creator { name } } } } } } } }', context_value=request).data, indent=2)

#get ideas:
print json.dumps(schema.execute('query { ideas(first: 5) { pageInfo { endCursor hasNextPage } edges { node { id } } } }', context_value=request).data, indent=2)

#get posts:
print json.dumps(schema.execute('query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on Post {id, creator { name }, subject, body, sentimentCounts {dontUnderstand disagree like moreInfo }} } } } }', context_value=request).data, indent=2)
# curl --silent -XPOST -H "Content-Type:application/json" -d '{ "query": "query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on Post {id, creator { name }} } } } }" }' http://localhost:6543/sandbox/graphql
# to be authenticated add the assembl_session cookie (look the value in the Chrome console):
# -H 'Cookie:assembl_session=d8deabe718595c01d3899aa686ac027193cc7d6984bd73b14afc42738d798018629b6e8a;'

#get thematics with questions:
print json.dumps(schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=request).data, indent=2)

'''
