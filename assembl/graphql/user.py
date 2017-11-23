import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from .types import SecureObjectType


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
