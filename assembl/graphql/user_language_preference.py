import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from assembl.models.auth import LanguagePreferenceOrder, UserLanguagePreferenceCollection
from assembl.auth import CrudPermissions
from assembl.graphql.types import SecureObjectType
from assembl.graphql.user import AgentProfile
from assembl.graphql.locale import Locale
from assembl.graphql.permissions_helpers import require_cls_permission


PreferenceSourceEnum = graphene.Enum.from_enum(LanguagePreferenceOrder)


class UserLanguagePreference(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.UserLanguagePreference
        interfaces = (Node, )
        only_fields = ('id')

    user = graphene.Field(AgentProfile)
    locale = graphene.Field(lambda: Locale, lang=graphene.String(required=False))
    translation_locale = graphene.Field(lambda: Locale)
    order = graphene.Int()
    source = graphene.Field(PreferenceSourceEnum)

    def resolve_locale(self, args, context, info):
        lang = args.get('lang')
        label = None
        if lang:
            target_locale = models.Locale.get_or_create(lang)
            labels = models.LocaleLabel.names_in_locale(target_locale)
            label = labels[self.locale.code]

        return Locale(
            locale_code=self.locale.code,
            label=label)

    def resolve_source(self, args, context, info):
        return LanguagePreferenceOrder.get_name_from_order(self.source_of_evidence)


class CreateOrUpdateUserLanguagePreference(graphene.Mutation):
    class Input:
        locale = graphene.String(required=True)
        order = graphene.Int()
        translation_locale = graphene.String()
        source = graphene.String(required=True)
        post_id = graphene.String()

    user_language_preference = graphene.Field(UserLanguagePreference)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.UserLanguagePreference
        require_cls_permission(CrudPermissions.CREATE, cls, context)

        locale = args.get('locale')
        source = args.get('source')
        source_of_evidence = LanguagePreferenceOrder[source]
        translation_locale = args.get('translation_locale', None)
        order = int(args.get('order', 0))
        # post_id = args.get('post_id')

        db = models.UserLanguagePreference.default_db
        lang_prefs = UserLanguagePreferenceCollection.getCurrent(req=context)
        pref = lang_prefs.add_locale(
            locale,
            db,
            source_of_evidence=source_of_evidence.value,
            preferred_order=order,
            translate_to_locale=models.Locale.get_or_create(translation_locale) if translation_locale else None
        )
        db.flush()

        return CreateOrUpdateUserLanguagePreference(user_language_preference=pref)
