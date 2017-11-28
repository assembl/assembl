import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.security import Everyone
from pyramid.httpexceptions import HTTPUnauthorized
from assembl.auth.util import get_permissions
from assembl import models
from assembl.models.auth import (
    LanguagePreferenceOrder)
from assembl.auth import CrudPermissions, IF_OWNED
from .types import SecureObjectType
from .user import AgentProfile
from .locale import Locale


PreferenceSourceEnum = graphene.Enum.from_enum(LanguagePreferenceOrder)


class UserLanguagePreference(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.UserLanguagePreference
        interfaces = (Node, )
        only_fields = ('id')

    user = graphene.Field(AgentProfile)
    locale = graphene.Field(lambda: Locale)
    translation_locale = graphene.Field(lambda: Locale)
    order = graphene.Int()
    source = graphene.Field(PreferenceSourceEnum)


def _mutate(create, *args, **kwargs):
    cls = models.UserLanguagePreference
    context = kwargs.get('context')

    user_id = context.authenticated_userid or Everyone
    discussion_id = context.matchdict['discussion_id']

    permissions = get_permissions(user_id, discussion_id)
    permission_to_check = CrudPermissions.CREATE
    if not create:
        permission_to_check = CrudPermissions.UPDATE
    allowed = cls.user_can_cls(user_id, permission_to_check, permissions)
    if not allowed or (allowed == IF_OWNED and user_id == Everyone):
        raise HTTPUnauthorized()

    args = kwargs.get('args')
    locale = args.get('locale')
    source = args.get('source')
    source_of_evidence = LanguagePreferenceOrder[source]
    translation_locale = args.get('translation_locale', None)
    order = int(args.get('order', 0))

    db = models.UserLanguagePreference.default_db
    if create:
        ulp = models.UserLanguagePreference(
            user_id=user_id,
            locale=models.Locale.get_or_create(locale),
            translate_to_locale=models.Locale.get_or_create(
                translation_locale) if translation_locale else None,
            source_of_evidence=source_of_evidence.value,
            preferred_order=order)
        db.add(ulp)
        db.flush()

        return ulp

    user = models.User.get(user_id)
    ulps = user.language_preference
    ulp_to_return = None
    for ulp in ulps:
        if ulp.source_of_evidence == source_of_evidence.value:
            ulp.locale = models.Locale.get_or_create(locale)
            ulp.translate_to_locale = models.Locale.get_or_create(
                translation_locale) if translation_locale else None
            ulp.preferred_order = order
            ulp_to_return = ulp
    db.flush()
    return ulp_to_return


class CreateUserLanguagePreference(graphene.Mutation):
    class Input:
        locale = graphene.String(required=True)
        order = graphene.Int()
        translation_locale = graphene.String()
        source = graphene.String(required=True)

    language_preference = graphene.Field(UserLanguagePreference)

    @staticmethod
    def mutate(root, args, context, info):
        ulp = _mutate(create=True, root=root,
                      args=args, context=context,
                      info=info)

        return CreateUserLanguagePreference(language_preference=ulp)


class UpdateUserLanguagePreference(CreateUserLanguagePreference):
    class Input:
        locale = graphene.String(required=True)
        order = graphene.Int()
        translation_locale = graphene.String()
        source = graphene.String(required=True)

    language_preference = graphene.Field(UserLanguagePreference)

    @staticmethod
    def mutate(root, args, context, info):
        ulp = _mutate(create=False, root=root,
                      args=args, context=context,
                      info=info)

        return UpdateUserLanguagePreference(language_preference=ulp)
