# -*- coding: utf-8 -*-
import logging
from random import randint
from operator import attrgetter

import graphene
from graphene.relay import Node
from graphene_sqlalchemy.converter import (convert_column_to_string,
                                           convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

from assembl import models

from assembl.graphql.discussion import (Discussion, UpdateDiscussion, DiscussionPreferences,
                                        LegalContents, LocalePreference,
                                        UpdateLegalContents,
                                        ResourcesCenter,
                                        UpdateDiscussionPreferences,
                                        UpdateResourcesCenter, VisitsAnalytics)
from assembl.graphql.document import UploadDocument
from assembl.graphql.idea import (CreateIdea, CreateThematic, DeleteThematic,
                                  Idea, IdeaUnion, Thematic, UpdateThematic)
from assembl.graphql.landing_page import (LandingPageModuleType, LandingPageModule, CreateLandingPageModule,
                                          UpdateLandingPageModule)
from assembl.graphql.langstring import resolve_langstring
from assembl.graphql.locale import Locale
from assembl.graphql.post import (AddPostAttachment, CreatePost, DeletePost,
                                  DeletePostAttachment, UndeletePost,
                                  UpdatePost, AddPostExtract)
from assembl.graphql.extract import (UpdateExtract, DeleteExtract)
from assembl.graphql.resource import (CreateResource, DeleteResource, Resource,
                                      UpdateResource)
from assembl.graphql.section import (CreateSection, DeleteSection, Section,
                                     UpdateSection)
from assembl.graphql.sentiment import AddSentiment, DeleteSentiment
from assembl.graphql.synthesis import Synthesis
from assembl.graphql.user import UpdateUser, DeleteUserInformation
from .configurable_fields import ConfigurableFieldUnion, CreateTextField, UpdateTextField, DeleteTextField, ProfileField, UpdateProfileFields
from assembl.graphql.votes import AddTokenVote, DeleteTokenVote, AddGaugeVote, DeleteGaugeVote
from assembl.graphql.vote_session import (
    VoteSession, UpdateVoteSession, CreateTokenVoteSpecification,
    CreateGaugeVoteSpecification, UpdateGaugeVoteSpecification,
    CreateNumberGaugeVoteSpecification, UpdateNumberGaugeVoteSpecification,
    UpdateTokenVoteSpecification, DeleteVoteSpecification,
    CreateProposal, UpdateProposal, DeleteProposal
)
from assembl.graphql.utils import get_fields, get_root_thematic_for_phase
from assembl.lib.locale import strip_country
from assembl.lib.sqla_types import EmailString
from assembl.models.action import SentimentOfPost
from assembl.models.post import countable_publication_states
from assembl.nlp.translation_service import DummyGoogleTranslationService
from assembl.graphql.permissions_helpers import require_instance_permission
from assembl.auth import CrudPermissions

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
    vote_session = graphene.Field(VoteSession, discussion_phase_id=graphene.Int(required=True))
    resources = graphene.List(Resource)
    resources_center = graphene.Field(lambda: ResourcesCenter)
    has_resources_center = graphene.Boolean()
    sections = graphene.List(Section)
    legal_contents = graphene.Field(lambda: LegalContents)
    has_legal_notice = graphene.Boolean(lang=graphene.String(required=True))
    has_terms_and_conditions = graphene.Boolean(
        lang=graphene.String(required=True))
    has_cookies_policy = graphene.Boolean(lang=graphene.String(required=True))
    has_privacy_policy = graphene.Boolean(lang=graphene.String(required=True))
    visits_analytics = graphene.Field(lambda: VisitsAnalytics)
    discussion = graphene.Field(Discussion)
    landing_page_module_types = graphene.List(LandingPageModuleType)
    landing_page_modules = graphene.List(LandingPageModule)
    text_fields = graphene.List(ConfigurableFieldUnion)
    profile_fields = graphene.List(ProfileField)

    def resolve_resources(self, args, context, info):
        model = models.Resource
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        # order by id to always return resources in the order in which they have been created
        return query.filter(model.discussion_id == discussion_id).order_by(model.id)

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

    def resolve_vote_session(self, args, context, info):
        discussion_phase_id = args.get('discussion_phase_id')
        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)
        require_instance_permission(CrudPermissions.READ, discussion_phase, context)
        vote_session = discussion_phase.vote_session
        if vote_session is not None:
            require_instance_permission(CrudPermissions.READ, vote_session, context)
        return vote_session

    def resolve_ideas(self, args, context, info):
        model = models.Idea
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        descendants_query = discussion.root_idea.get_descendants_query(inclusive=False)
        query = query.outerjoin(
                models.Idea.source_links
            ).filter(model.id.in_(descendants_query)
            ).filter(
                model.hidden == False,  # noqa: E712
                model.sqla_type == 'idea',
                model.tombstone_date == None  # noqa: E711
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
                models.Synthesis.creation_date)

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

    def resolve_sections(self, args, context, info):
        model = models.Section
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        return query.filter(model.discussion_id == discussion_id).order_by(model.order)

    def resolve_legal_contents(self, args, context, info):
        """Legal notice,terms and conditions, cookies and privacy policy entries (e.g. for admin form)."""
        return LegalContents()

    def resolve_has_legal_notice(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        text = resolve_langstring(discussion.legal_notice, args.get('lang'))
        # if the field is empty in the admin section, it will contain html markup (u'<p></p>')
        return text and len(text) > 10

    def resolve_has_terms_and_conditions(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        text = resolve_langstring(
            discussion.terms_and_conditions, args.get('lang'))
        # if the field is empty in the admin section, it will contain html markup (u'<p></p>')
        return text and len(text) > 10

    def resolve_has_cookies_policy(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        text = resolve_langstring(
            discussion.cookies_policy, args.get('lang'))
        # if the field is empty in the admin section, it will contain html markup (u'<p></p>')
        return text and len(text) > 10

    def resolve_has_privacy_policy(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        text = resolve_langstring(
            discussion.privacy_policy, args.get('lang'))
        # if the field is empty in the admin section, it will contain html markup (u'<p></p>')
        return text and len(text) > 10

    def resolve_visits_analytics(self, args, context, info):
        try:
            fields = get_fields(info)
            if 'sumVisitsLength' in fields and 'nbPageviews' in fields and 'nbUniqPageviews' in fields:
                return VisitsAnalytics.build_from_full_query(args, context, info)
            else:
                return VisitsAnalytics()
        except Exception:
            context.logger().exception('Error with Matomo request')
            return VisitsAnalytics()

    def resolve_discussion(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return discussion

    def resolve_landing_page_module_types(self, args, context, info):
        model = models.LandingPageModuleType
        return get_query(model, context)

    def resolve_landing_page_modules(self, args, context, info):
        model = models.LandingPageModule
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        # we want to return a LandingPageModule for each module type (even if there is no entry yet in LandingPageModule table)
        module_types = get_query(models.LandingPageModuleType, context).order_by(models.LandingPageModuleType.default_order).all()
        modules = []
        for module_type in module_types:
            saobj = query.filter(
                model.discussion_id == discussion_id
            ).join(
                model.module_type
            ).filter(
                models.LandingPageModuleType.identifier == module_type.identifier
            ).first()

            if saobj:
                module = saobj
            else:
                # create the graphene object for this module type
                module = LandingPageModule(
                    configuration=u'{}',
                    id=randint(-100000, 0),
                    enabled=module_type.required,
                    module_type=module_type,
                    order=module_type.default_order
                )

            modules.append(module)

        return sorted(modules, key=attrgetter('order'))

    def resolve_text_fields(self, args, context, info):
        model = models.AbstractConfigurableField
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        return query.filter(model.discussion_id == discussion_id).order_by(model.order)

    def resolve_profile_fields(self, args, context, info):
        model = models.ProfileField
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid
        fields = get_query(
            models.AbstractConfigurableField, context).filter(
                models.AbstractConfigurableField.discussion_id == discussion_id
        ).order_by(models.AbstractConfigurableField.order).all()
        profile_fields = []
        if user_id is None:
            raise Exception('No user id')

        for field in fields:
            saobj = query.filter(
                model.discussion_id == discussion_id
            ).filter(
                models.ProfileField.configurable_field == field
            ).filter(
                models.ProfileField.agent_profile_id == user_id
            ).first()

            if saobj:
                profile_field = saobj
            else:
                profile_field = ProfileField(
                    agent_profile=models.AgentProfile.get(user_id),
                    id=randint(-100000, 0),
                    configurable_field=field,
                )

            profile_fields.append(profile_field)

        return profile_fields


class Mutations(graphene.ObjectType):

    update_discussion = UpdateDiscussion.Field()
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
    create_section = CreateSection.Field()
    delete_section = DeleteSection.Field()
    update_section = UpdateSection.Field()
    update_legal_contents = UpdateLegalContents.Field()
    update_user = UpdateUser.Field()
    DeleteUserInformation = DeleteUserInformation.Field()
    update_vote_session = UpdateVoteSession.Field()
    create_token_vote_specification = CreateTokenVoteSpecification.Field()
    update_token_vote_specification = UpdateTokenVoteSpecification.Field()
    create_gauge_vote_specification = CreateGaugeVoteSpecification.Field()
    update_gauge_vote_specification = UpdateGaugeVoteSpecification.Field()
    create_number_gauge_vote_specification = CreateNumberGaugeVoteSpecification.Field()
    update_number_gauge_vote_specification = UpdateNumberGaugeVoteSpecification.Field()
    delete_vote_specification = DeleteVoteSpecification.Field()
    create_landing_page_module = CreateLandingPageModule.Field()
    update_landing_page_module = UpdateLandingPageModule.Field()
    create_proposal = CreateProposal.Field()
    update_proposal = UpdateProposal.Field()
    delete_proposal = DeleteProposal.Field()
    add_token_vote = AddTokenVote.Field()
    delete_token_vote = DeleteTokenVote.Field()
    add_gauge_vote = AddGaugeVote.Field()
    delete_gauge_vote = DeleteGaugeVote.Field()
    add_post_extract = AddPostExtract.Field()
    update_extract = UpdateExtract.Field()
    delete_extract = DeleteExtract.Field()
    create_text_field = CreateTextField.Field()
    update_text_field = UpdateTextField.Field()
    delete_text_field = DeleteTextField.Field()
    update_profile_fields = UpdateProfileFields.Field()


Schema = graphene.Schema(query=Query, mutation=Mutations)


def generate_schema_json_from_schema(schema, output='/tmp/schema.json'):
    import json
    schema_dict = schema.introspect()
    with open(output, 'w') as outfile:
        json.dump(schema_dict, outfile, indent=2)


def generate_schema_json():
    generate_schema_json_from_schema(Schema)


'''  # noqa: E501
$ assembl-pshell local.ini
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
