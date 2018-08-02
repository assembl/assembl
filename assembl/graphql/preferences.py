import graphene
from graphene.relay import Node

from pyramid.httpexceptions import HTTPUnauthorized

from .utils import abort_transaction_on_exception
from assembl.auth.util import get_permissions
from assembl import models
from assembl.auth import Everyone, CrudPermissions
import assembl.graphql.docstrings as docs


class TranslationFields(graphene.AbstractType):
    locale_from = graphene.String(required=True, description=docs.Translation.locale_from)
    locale_into = graphene.String(required=True, description=docs.Translation.locale_into)


class Translation(graphene.ObjectType, TranslationFields):
    pass


class TranslationInput(graphene.InputObjectType, TranslationFields):
    pass


class Preferences(graphene.ObjectType):
    harvesting_translation = graphene.Field(
        Translation, description=docs.Preferences.harvesting_translation)

    def resolve_harvesting_translation(self, args, context, info):
        translation = self.get('harvesting_translation', None)
        if translation:
            return Translation(**translation)


class UpdateHarvestingTranslationPreference(graphene.Mutation):

    class Input:
        id = graphene.ID(
            required=True, description=docs.UpdateHarvestingTranslationPreference.id)
        translation = TranslationInput(
            required=True, description=docs.UpdateHarvestingTranslationPreference.translation)

    preferences = graphene.Field(
        Preferences, description=docs.UpdateHarvestingTranslationPreference.preferences)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        model = models.User
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        global_id = args.get('id')
        id_ = int(Node.from_global_id(global_id)[1])
        user = model.get(id_)
        # Global permission check. Permission is checked in the preferences setter
        # Is it necessary?
        permissions = get_permissions(user_id, discussion_id)
        allowed = user.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized("The authenticated user can't update this harvesting locale")

        with model.default_db.no_autoflush as db:
            preferences = user.get_preferences_for_discussion(discussion)
            # Permission check in the preferences setter
            # See models.user_key_value and models.preferences preference_data_list
            preferences['harvesting_translation'] = args.get('translation')
            db.flush()

        return UpdateHarvestingTranslationPreference(
            preferences=preferences)
