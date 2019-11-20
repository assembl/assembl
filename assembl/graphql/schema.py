# -*- coding: utf-8 -*-
from operator import attrgetter
from random import randint

import dateutil.parser
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene_sqlalchemy.converter import (convert_column_to_string,
                                           convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query
from sqlalchemy import func
from sqlalchemy.orm import subqueryload

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import CrudPermissions
from assembl.graphql.discussion import (Discussion, UpdateDiscussion, DiscussionPreferences,
                                        LegalContents,
                                        UpdateLegalContents,
                                        ResourcesCenter,
                                        UpdateDiscussionPreferences,
                                        UpdateResourcesCenter, VisitsAnalytics)
from assembl.graphql.document import UploadDocument
from assembl.graphql.extract import (UpdateExtract, UpdateExtractTags, DeleteExtract, ConfirmExtract)
from assembl.graphql.idea import (CreateThematic, DeleteThematic,
                                  IdeaUnion, UpdateThematic, UpdateIdeas)
from assembl.graphql.landing_page import (LandingPageModuleType, LandingPageModule, CreateLandingPageModule,
                                          UpdateLandingPageModule)
from assembl.graphql.langstring import resolve_langstring
from assembl.graphql.locale import Locale
from assembl.graphql.permissions_helpers import require_instance_permission
from assembl.graphql.post import (CreatePost, DeletePost,
                                  ValidatePost,
                                  UpdatePost, AddPostExtract, PostConnection,
                                  AddPostsExtract, UpdateShareCount)
from assembl.graphql.preferences import UpdateHarvestingTranslationPreference
from assembl.graphql.resource import (CreateResource, DeleteResource, Resource,
                                      UpdateResource)
from assembl.graphql.section import (CreateSection, DeleteSection, Section,
                                     UpdateSection)
from assembl.graphql.sentiment import AddSentiment, DeleteSentiment
from assembl.graphql.synthesis import Synthesis, CreateSynthesis, UpdateSynthesis, DeleteSynthesis
from assembl.graphql.tag import Tag, AddTag, RemoveTag, UpdateTag
from assembl.graphql.timeline import (
    DiscussionPhase, CreateDiscussionPhase,
    UpdateDiscussionPhase, DeleteDiscussionPhase)
from assembl.graphql.user import UpdateUser, DeleteUserInformation, UpdateAcceptedCookies
from assembl.graphql.utils import get_fields, get_root_thematic_for_phase
from assembl.graphql.vote_session import (
    VoteSession, UpdateVoteSession, CreateTokenVoteSpecification,
    CreateGaugeVoteSpecification, UpdateGaugeVoteSpecification,
    CreateNumberGaugeVoteSpecification, UpdateNumberGaugeVoteSpecification,
    UpdateTokenVoteSpecification, DeleteVoteSpecification,
    CreateProposal, UpdateProposal, DeleteProposal
)
from assembl.graphql.votes import AddTokenVote, AddGaugeVote
from assembl.lib import logging
from assembl.lib.locale import strip_country
from assembl.lib.sqla_types import EmailString
from assembl.models.action import SentimentOfPost
from assembl.models.post import countable_publication_states
from assembl.nlp.translation_service import DummyGoogleTranslationService
from assembl.utils import get_ideas, get_posts_for_phases
from .configurable_fields import (
    ConfigurableFieldUnion, CreateTextField, UpdateTextField,
    DeleteTextField, ProfileField, UpdateProfileFields)

# from assembl.models.timeline import get_phase_by_identifier, Phases


convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)
models.Base.query = models.Base.default_db.query_property()

log = logging.getLogger()


# For security, always use only_fields in the Meta class to be sure we don't
# expose every fields and relations. You need at least only_fields = ('id', )
# to take effect.
# Auto exposing everything will automatically convert relations
# like AgentProfile.posts_created and create dynamically the
# object types Post, PostConnection which will conflict with those added
# manually.

class Query(graphene.ObjectType):
    node = Node.Field(description=docs.Schema.node)
    root_idea = graphene.Field(
        IdeaUnion, discussion_phase_id=graphene.Int(description=docs.Default.discussion_phase_id), description=docs.Schema.root_idea)
    ideas = graphene.List(
        IdeaUnion, discussion_phase_id=graphene.Int(required=True, description=docs.Default.discussion_phase_id), description=docs.Schema.ideas)
    syntheses = graphene.List(Synthesis, description=docs.Schema.syntheses)
    num_participants = graphene.Int(description=docs.Schema.num_participants)
    discussion_preferences = graphene.Field(DiscussionPreferences, description=docs.Schema.discussion_preferences)
    default_preferences = graphene.Field(DiscussionPreferences, description=docs.Schema.default_preferences)
    locales = graphene.List(
        Locale,
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.locales)
    total_sentiments = graphene.Int(description=docs.Schema.total_sentiments)
    total_vote_session_participations = graphene.Int(required=True, description=docs.Schema.total_vote_session_participations)
    has_syntheses = graphene.Boolean(description=docs.Schema.has_syntheses)
    vote_session = graphene.Field(
        VoteSession,
        idea_id=graphene.ID(required=True, description=docs.VoteSession.idea_id),
        description=docs.Schema.vote_session)
    resources = graphene.List(Resource, description=docs.Schema.resources)
    resources_center = graphene.Field(lambda: ResourcesCenter, description=docs.Schema.resources_center)
    has_resources_center = graphene.Boolean(description=docs.Schema.has_resources_center)
    sections = graphene.List(Section, description=docs.Schema.sections)
    legal_contents = graphene.Field(lambda: LegalContents, description=docs.Schema.legal_contents)
    has_legal_notice = graphene.Boolean(
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.has_legal_notice)
    has_terms_and_conditions = graphene.Boolean(
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.has_terms_and_conditions)
    has_cookies_policy = graphene.Boolean(
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.has_cookies_policy)
    has_privacy_policy = graphene.Boolean(
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.has_privacy_policy)
    has_user_guidelines = graphene.Boolean(
        lang=graphene.String(required=True, description=docs.Default.required_language_input),
        description=docs.Schema.has_user_guidelines)
    visits_analytics = graphene.Field(lambda: VisitsAnalytics, description=docs.Schema.visits_analytics)
    discussion = graphene.Field(Discussion, description=docs.Schema.discussion)
    landing_page_module_types = graphene.List(LandingPageModuleType, description=docs.Schema.landing_page_module_types)
    landing_page_modules = graphene.List(LandingPageModule, description=docs.Schema.landing_page_modules)
    text_fields = graphene.List(ConfigurableFieldUnion, description=docs.Schema.text_fields)
    profile_fields = graphene.List(ProfileField, description=docs.Schema.profile_fields)
    timeline = graphene.List(DiscussionPhase, description=docs.Schema.timeline)
    posts = SQLAlchemyConnectionField(
        PostConnection,
        start_date=graphene.String(description=docs.SchemaPosts.start_date),
        end_date=graphene.String(description=docs.SchemaPosts.end_date),
        identifiers=graphene.List(graphene.String, description=docs.SchemaPosts.identifiers),
        description=docs.SchemaPosts.__doc__)
    tags = graphene.List(
        lambda: Tag,
        filter=graphene.String(description=docs.SchemaTags.filter),
        limit=graphene.Int(description=docs.SchemaTags.limit),
        description=docs.SchemaTags.__doc__)
    hashtags = graphene.List(
        graphene.String,
        idea_id=graphene.ID(required=True, description=docs.SchemaHashtags.idea_id),
        description=docs.SchemaHashtags.__doc__)

    def resolve_tags(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        _filter = args.get('filter', '')
        limit = args.get('limit', 0)
        model = models.Keyword
        query = get_query(model, context).filter(
            model.discussion_id == discussion_id)

        if not _filter:
            if limit == 0:
                return query.all()
            else:
                return query.limit(limit).all()

        _filter = '%{}%'.format(_filter)
        return query.filter(model.value.ilike(_filter)).all()

    def resolve_hashtags(self, args, context, info):
        from sqlalchemy.orm import aliased

        discussion_id = context.matchdict['discussion_id']
        idea_id = args.get('idea_id')
        idea_id = int(Node.from_global_id(idea_id)[1])
        idea = get_query(models.Idea, context).get(idea_id)
        idea_posts_query = idea.get_related_posts_query()
        idea_posts_subquery = idea_posts_query.with_entities(models.Post.id).subquery('idea_posts')
        all_posts = aliased(models.Post, name='all_posts')
        posts_with_hashtags = idea.db.query(
            all_posts.id,
            models.LangStringEntry.array_agg_hashtags.label('hashtags'),
        ).join(
            idea_posts_subquery,
            all_posts.id == idea_posts_subquery.c.id
        ).outerjoin(
            models.LangStringEntry,
            models.LangStringEntry.langstring_id == all_posts.body_id
        ).filter(
            all_posts.discussion_id == discussion_id,  # optimisation
            models.LangStringEntry.have_hashtags_condition,  # can't aggregate null or empty arrays
        ).group_by(all_posts.id)

        # with unnest, we can do this in sql, but this is quite unreadable and not sure it is faster
        all_hashtags = set()
        for langstring_hashtags in (langstring_hashtags
                                    for _, posts_hashtags in posts_with_hashtags.all()
                                    for langstring_hashtags in posts_hashtags):
            all_hashtags = all_hashtags.union(langstring_hashtags)

        return sorted(all_hashtags)

    def resolve_resources(self, args, context, info):
        model = models.Resource
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        return query.filter(model.discussion_id == discussion_id).order_by(model.order)

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

    def resolve_total_vote_session_participations(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        vote_sessions = discussion.db.query(models.VoteSession).filter(models.VoteSession.discussion_id == discussion_id).all()
        total = 0
        for vote_session in vote_sessions:
            root_thematic = vote_session.idea if vote_session else None
            if root_thematic is None:
                continue

            total += vote_session.get_num_votes()
        return total

    def resolve_root_idea(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        discussion_phase_id = args.get('discussion_phase_id')
        if not discussion_phase_id:
            return discussion.root_idea

        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)
        root_thematic = get_root_thematic_for_phase(discussion_phase)
        return root_thematic

    def resolve_vote_session(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        idea_id = args.get('idea_id')
        idea_id = int(Node.from_global_id(idea_id)[1])
        vote_session = discussion.db.query(models.VoteSession).filter(models.VoteSession.idea_id == idea_id).first()
        if vote_session is not None:
            require_instance_permission(CrudPermissions.READ, vote_session, context)
        return vote_session

    def resolve_ideas(self, args, context, info):
        phase_id = args.get('discussion_phase_id')
        phase = models.DiscussionPhase.get(phase_id)
        return get_ideas(
            phase,
            options=[subqueryload(models.Idea.attachments).joinedload("document")])

    def resolve_syntheses(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return discussion.get_all_syntheses_query(
            include_unpublished=False, user_id=context.authenticated_userid).order_by(
                models.Synthesis.creation_date)

    def resolve_has_syntheses(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        query = discussion.get_all_syntheses_query(include_unpublished=False, user_id=context.authenticated_userid)
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
        return discussion.preferences or models.Preferences.get_default_preferences()

    def resolve_default_preferences(self, args, context, info):
        return models.Preferences.get_default_preferences()

    def resolve_locales(self, args, context, info):
        locales = DummyGoogleTranslationService.target_localesC()
        asPosixLocale = DummyGoogleTranslationService.asPosixLocale
        lang = args.get('lang')
        target_locale = strip_country(
            models.Locale.get_or_create(lang))
        locales_without_country = [strip_country(asPosixLocale(loc)) for loc in locales]
        labels_en = models.LocaleLabel.names_of_locales_in_locale(
            locales_without_country,
            models.Locale.get_or_create('en'))
        if lang == 'en':
            labels = labels_en
        else:
            # labels can be a subset of labels_en or completely empty
            # if there is no translation of the locales for target_locale
            labels = models.LocaleLabel.names_of_locales_in_locale(
                locales_without_country,
                target_locale)
        result = []
        for locale_code, label_en in labels_en.items():
            label = labels.get(locale_code, label_en)
            result.append(Locale(locale_code=locale_code, label=label))

        return sorted(result, key=lambda locale: locale.label)

    def resolve_resources_center(self, args, context, info):
        return ResourcesCenter()

    def resolve_sections(self, args, context, info):
        model = models.Section
        query = get_query(model, context)
        discussion_id = context.matchdict['discussion_id']
        return query.filter(model.discussion_id == discussion_id).order_by(model.order)

    def resolve_legal_contents(self, args, context, info):
        """Legal notice,terms and conditions, cookies, privacy policy and user guidelines entries (e.g. for admin form)."""
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

    def resolve_has_user_guidelines(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        text = resolve_langstring(
            discussion.user_guidelines, args.get('lang'))
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
            module = query.filter(
                model.discussion_id == discussion_id
            ).join(
                model.module_type
            ).filter(
                models.LandingPageModuleType.identifier == module_type.identifier
            ).all()

            if module:
                modules.extend(module)
            else:
                # create the graphene object for this module type
                module = LandingPageModule(
                    configuration=u'{}',
                    id=randint(-100000, 0),
                    enabled=module_type.required,
                    module_type=module_type,
                    order=module_type.default_order,
                    title=None,
                    subtitle=None
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

    def resolve_timeline(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return discussion.timeline_phases

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        identifiers = args.get('identifiers', [])
        model = models.AssemblPost
        # Note: This is only used by BigDatext, posts in moderating phase excluded
        query = get_posts_for_phases(discussion, identifiers, include_moderating=False)
        # If no posts in the specified identifiers, we return an empty list
        if identifiers and query is None:
            return []
        elif query is None:
            # If we have no identifier, we return all of posts
            query = get_query(model, context)

        # We filter posts by their discussion id
        query = query.filter(
            model.discussion_id == discussion_id,
            model.hidden == False,  # noqa: E712
            model.tombstone_condition()
            )
        # We filter posts by their modification date
        start_date = args.get('start_date', None)
        end_date = args.get('end_date', None)
        if start_date:
            start_date = dateutil.parser.parse(start_date)
            query = query.filter(model.modification_date >= start_date)

        if end_date:
            end_date = dateutil.parser.parse(end_date)
            query = query.filter(model.modification_date <= end_date)

        return query.all()


class Mutations(graphene.ObjectType):

    update_discussion = UpdateDiscussion.Field(description=docs.UpdateDiscussion.__doc__)
    create_thematic = CreateThematic.Field(description=docs.CreateThematic.__doc__)
    update_thematic = UpdateThematic.Field(description=docs.UpdateThematic.__doc__)
    delete_thematic = DeleteThematic.Field(description=docs.DeleteThematic.__doc__)
    update_ideas = UpdateIdeas.Field(description=docs.UpdateIdeas.__doc__)
    create_post = CreatePost.Field(description=docs.CreatePost.__doc__)
    update_post = UpdatePost.Field(description=docs.UpdatePost.__doc__)
    update_share_count = UpdateShareCount.Field(description=docs.UpdateShareCount.__doc__)
    delete_post = DeletePost.Field(description=docs.DeletePost.__doc__)
    validate_post = ValidatePost.Field(description=docs.ValidatePost.__doc__)
    add_sentiment = AddSentiment.Field(description=docs.AddSentiment.__doc__)
    delete_sentiment = DeleteSentiment.Field(description=docs.DeleteSentiment.__doc__)
    upload_document = UploadDocument.Field(description=docs.UploadDocument.__doc__)
    update_discussion_preferences = UpdateDiscussionPreferences.Field(description=docs.UpdateDiscussionPreferences.__doc__)
    create_resource = CreateResource.Field(description=docs.CreateResource.__doc__)
    delete_resource = DeleteResource.Field(description=docs.DeleteResource.__doc__)
    update_resource = UpdateResource.Field(description=docs.UpdateResource.__doc__)
    update_resources_center = UpdateResourcesCenter.Field(description=docs.UpdateResourcesCenter.__doc__)
    create_synthesis = CreateSynthesis.Field(description=docs.CreateSynthesis.__doc__)
    update_synthesis = UpdateSynthesis.Field(description=docs.UpdateSynthesis.__doc__)
    delete_synthesis = DeleteSynthesis.Field(description=docs.DeleteSynthesis.__doc__)
    create_section = CreateSection.Field(description=docs.CreateSection.__doc__)
    delete_section = DeleteSection.Field(description=docs.DeleteSection.__doc__)
    update_section = UpdateSection.Field(description=docs.UpdateSection.__doc__)
    update_legal_contents = UpdateLegalContents.Field(description=docs.UpdateLegalContents.__doc__)
    update_user = UpdateUser.Field(description=docs.UpdateUser.__doc__)
    delete_user_information = DeleteUserInformation.Field(description=docs.DeleteUserInformation.__doc__)
    update_accepted_cookies = UpdateAcceptedCookies.Field(description=docs.UpdateAcceptedCookies.__doc__)
    update_vote_session = UpdateVoteSession.Field(description=docs.UpdateVoteSession.__doc__)
    create_token_vote_specification = CreateTokenVoteSpecification.Field(description=docs.CreateTokenVoteSpecification.__doc__)
    update_token_vote_specification = UpdateTokenVoteSpecification.Field(description=docs.UpdateTokenVoteSpecification.__doc__)
    create_gauge_vote_specification = CreateGaugeVoteSpecification.Field(description=docs.CreateGaugeVoteSpecification.__doc__)
    update_gauge_vote_specification = UpdateGaugeVoteSpecification.Field(description=docs.UpdateGaugeVoteSpecification.__doc__)
    create_number_gauge_vote_specification = CreateNumberGaugeVoteSpecification.Field(description=docs.CreateNumberGaugeVoteSpecification.__doc__)
    update_number_gauge_vote_specification = UpdateNumberGaugeVoteSpecification.Field(description=docs.UpdateNumberGaugeVoteSpecification.__doc__)
    delete_vote_specification = DeleteVoteSpecification.Field(description=docs.DeleteVoteSpecification.__doc__)
    create_landing_page_module = CreateLandingPageModule.Field(description=docs.CreateLandingPageModule.__doc__)
    update_landing_page_module = UpdateLandingPageModule.Field(description=docs.UpdateLandingPageModule.__doc__)
    create_proposal = CreateProposal.Field(description=docs.CreateProposal.__doc__)
    update_proposal = UpdateProposal.Field(description=docs.UpdateProposal.__doc__)
    delete_proposal = DeleteProposal.Field(description=docs.DeleteProposal.__doc__)
    add_token_vote = AddTokenVote.Field(description=docs.AddTokenVote.__doc__)
    add_gauge_vote = AddGaugeVote.Field(description=docs.AddGaugeVote.__doc__)
    add_post_extract = AddPostExtract.Field(description=docs.AddPostExtract.__doc__)
    add_posts_extract = AddPostsExtract.Field(description=docs.AddPostsExtract.__doc__)
    update_extract = UpdateExtract.Field(description=docs.UpdateExtract.__doc__)
    update_extract_tags = UpdateExtractTags.Field(description=docs.UpdateExtractTags.__doc__)
    update_tag = UpdateTag.Field(description=docs.UpdateTag.__doc__)
    delete_extract = DeleteExtract.Field(description=docs.DeleteExtract.__doc__)
    create_text_field = CreateTextField.Field(description=docs.CreateTextField.__doc__)
    confirm_extract = ConfirmExtract.Field(description=docs.ConfirmExtract.__doc__)
    update_text_field = UpdateTextField.Field(description=docs.UpdateTextField.__doc__)
    delete_text_field = DeleteTextField.Field(description=docs.DeleteTextField.__doc__)
    update_profile_fields = UpdateProfileFields.Field(description=docs.UpdateProfileFields.__doc__)
    create_discussion_phase = CreateDiscussionPhase.Field(description=docs.CreateDiscussionPhase.__doc__)
    update_discussion_phase = UpdateDiscussionPhase.Field(description=docs.CreateDiscussionPhase.__doc__)
    delete_discussion_phase = DeleteDiscussionPhase.Field(description=docs.DeleteDiscussionPhase.__doc__)
    update_harvesting_translation_preference = UpdateHarvestingTranslationPreference.Field(description=docs.UpdateHarvestingTranslationPreference.__doc__)
    add_tag = AddTag.Field(description=docs.AddTag.__doc__)
    remove_tag = RemoveTag.Field(description=docs.RemoveTag.__doc__)


Schema = graphene.Schema(query=Query, mutation=Mutations)


def generate_schema_json_from_schema(schema, output='/tmp/schema.json', spec_wrap=False):
    import json
    schema_dict = schema.introspect()
    if spec_wrap:
        # According to graphql specifications, the output of a query, including the introspection query,
        # should be wrapped in either "data" or "error".
        # https://graphql.org/learn/introspection/
        schema_dict = {u'data': schema_dict, u"error": None}
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
print json.dumps(schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title } } }', context_value=request).data, indent=2)

'''
