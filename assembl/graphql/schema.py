# -*- coding: utf-8 -*-
import logging

import graphene
from graphene.relay import Node
from graphene_sqlalchemy.converter import (convert_column_to_string,
                                           convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

from assembl import models
from assembl.lib.locale import strip_country
from assembl.lib.sqla_types import EmailString
from assembl.models.action import SentimentOfPost
from assembl.models.post import countable_publication_states
from assembl.nlp.translation_service import DummyGoogleTranslationService

from .document import UploadDocument
from .discussion import (DiscussionPreferences, LocalePreference,
                         ResourcesCenter, UpdateDiscussionPreferences,
                         UpdateResourcesCenter)
from .idea import (CreateIdea, CreateThematic, DeleteThematic, Idea, IdeaUnion,
                   Thematic, UpdateThematic)
from .locale import Locale
from .post import (
    CreatePost, DeletePost, UndeletePost, UpdatePost,
    AddPostAttachment, DeletePostAttachment)
from .resource import CreateResource, DeleteResource, Resource, UpdateResource
from .sentiment import AddSentiment, DeleteSentiment
from .synthesis import Synthesis
from .utils import get_root_thematic_for_phase


convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)
models.Base.query = models.Base.default_db.query_property()

log = logging.getLogger('assembl')


# For security, always use only_fields in the Meta class to be sure we don't
# expose every fields and relations. You need at least only_fields = ('id', )
# to take effect.
# Auto exposing everything will automatically convert relations
# like AgentProfile.posts_created and create dynamically the
# object types Post, PostConnection which will conflict with those added
# manually.


class Query(graphene.ObjectType):
    node = Node.Field()
    root_idea = graphene.Field(IdeaUnion, identifier=graphene.String())
    ideas = graphene.List(Idea, identifier=graphene.String(required=True))
    thematics = graphene.List(
        Thematic, identifier=graphene.String(required=True))
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
        resources_count = query.filter(
            model.discussion_id == discussion_id).count()
        return bool(resources_count)

    def resolve_total_sentiments(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        query = discussion.db.query(models.SentimentOfPost).filter(
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
                model.hidden == False,  # noqa: E712
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
            query = query.filter(
                models.Idea.message_view_override == 'messageColumns')

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
        return discussion.get_all_syntheses_query(
            include_unpublished=False).order_by(
                desc(models.Synthesis.creation_date))

    def resolve_has_syntheses(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        query = discussion.get_all_syntheses_query(include_unpublished=False)
        count = query.filter(
            models.Synthesis.is_next_synthesis != True).count()  # noqa: E712
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
        asPosixLocale = DummyGoogleTranslationService.asPosixLocale
        target_locale = strip_country(
            models.Locale.get_or_create(args.get('lang')))
        labels = models.LocaleLabel.names_of_locales_in_locale(
            [strip_country(asPosixLocale(loc)) for loc in locales],
            target_locale)
        return [Locale(locale_code=locale_code, label=label)
                for locale_code, label in sorted(labels.items(),
                                                 key=lambda entry: entry[1])]

    def resolve_resources_center(self, args, context, info):
        return ResourcesCenter()


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


'''  # noqa: E501
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
