from graphene_sqlalchemy import SQLAlchemyObjectType
from assembl import models
from .types import SecureObjectType


class UserLanguagePreference(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.UserLanguagePreference
