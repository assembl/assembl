import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from assembl import models
from assembl.models.auth import (
    LanguagePreferenceOrder)
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
    preferred_order = graphene.Int()
    source = graphene.Field(PreferenceSourceEnum)
