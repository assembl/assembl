import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from graphene_sqlalchemy.converter import (
    convert_column_to_string, convert_sqlalchemy_type)

from assembl.lib.sqla import get_named_class, get_named_object
from assembl.lib.sqla_types import EmailString
from assembl import models


convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)


class URINode(Node):

    class Meta:
        name = 'Node'

    @staticmethod
    def to_global_id(type, id):
        cls = get_named_class(type)
        return cls.uri_generic(id)

    @staticmethod
    def get_node_from_global_id(global_id, context, info, only_type=None):
        instance = get_named_object(global_id)
        if not instance:
            return None
        # Note that instance's class may be a subclass of URI's type
        if instance and only_type:
            assert instance in [cls.name for cls in instance.__class__.mro()],\
                'Received not compatible node.'
        graphene_type = info.schema.get_type(
            instance.__class__.__name__).graphene_type
        if not graphene_type:
            return None
        return instance


class AgentProfile(SQLAlchemyObjectType):

    class Meta:
        model = models.AgentProfile
        interfaces = (URINode, )


class User(AgentProfile):

    class Meta:
        model = models.User
        interfaces = (URINode, )
        exclude_fields = ('password')


class Query(graphene.ObjectType):
    node = URINode.Field()
    agentprofile = graphene.Field(AgentProfile)
    user = graphene.Field(User)


schema = graphene.Schema(query=Query)

# this can execute:
# schema.execute("query {node(id:\"local:AgentProfile/3\") {id ... on AgentProfile {name}} }")
