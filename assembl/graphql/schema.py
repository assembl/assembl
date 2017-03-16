from collections import OrderedDict

import six
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from graphene_sqlalchemy.converter import (
    convert_column_to_string, convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query
from assembl.lib.sqla import get_named_class, get_named_object
from assembl.lib.sqla_types import EmailString
from assembl import models
from .types import SQLAlchemyInterface, SQLAlchemyUnion

convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)
models.Base.query = models.Base.default_db.query_property()


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
            assert only_type in [cls.__name__ for cls in instance.__class__.mro()],\
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
        exclude_fields = ('password', )


class PostInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Post
        only_fields = ('id', 'creation_date', 'creator', 'subject', 'body', 'sentiment_counts')


class PropositionPost(SQLAlchemyObjectType):
    class Meta:
        model = models.PropositionPost
        interfaces = (URINode, PostInterface)
        only_fields = ('id', )  # inherits fields from Post interface only


class Post(SQLAlchemyObjectType):
    class Meta:
        model = models.Post
        interfaces = (URINode, PostInterface)
        only_fields = ('id', )  # inherits fields from Post interface only
        # only_fields = ('id', 'creation_date', 'creator', 'subject', 'body', 'sentiment_counts')
        # exclude_fields = ('idea_content_links_above_post', )


class PostUnion(SQLAlchemyUnion):
    class Meta:
        types = (PropositionPost, Post)
        model = models.Post

    # @classmethod
    # def resolve_type(cls, instance, context, info):
    #     if isinstance(instance, graphene.ObjectType):
    #         return type(instance)
    #     elif isinstance(instance, models.PropositionPost):
    #         return PropositionPost
    #     elif isinstance(instance, models.Post):
    #         return Post


# If we name the class PostConnection, we get the following error:
# AssertionError: Found different types with the same name in the schema: PostConnection, PostConnection.
class MyPostConnection(graphene.Connection):
    class Meta:
        node = PostUnion


class Query(graphene.ObjectType):
    node = URINode.Field()
    agent_profiles = SQLAlchemyConnectionField(AgentProfile)
    agent_profile = graphene.Field(AgentProfile)
    user = graphene.Field(User)
    posts = SQLAlchemyConnectionField(MyPostConnection)

    def resolve_posts(self, args, context, info):
        connection_type = info.return_type.graphene_type  # this is MyPostConnection
        model = connection_type._meta.node._meta.model  # this is models.Post
        query = get_query(model, context)
        discussion_id = context['discussion_id']
        query = query.filter(model.discussion_id == discussion_id
            ).filter(model.hidden == False
            ).filter(model.tombstone_condition())
        # pagination is done after that, no need to do it ourself
        return query


Schema = graphene.Schema(query=Query)

"""
query {
    getUserAgent(id: $ID){
        edge {
            whatever
        }
    }
}
"""

"""
pshell local.ini
import json
from assembl.graphql.schema import Schema as schema
print json.dumps(schema.execute('query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on PostInterface {id, creator { name }} } } } }', context_value={"discussion_id": 16}).data, indent=2)
"""

# curl --silent -XPOST -H "Content-Type:application/json" -d '{ "query": "query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on Post {id, creator { name }} } } } }" }' http://localhost:6543/sandbox/graphql

# this can execute:
# result = schema.execute("query {node(id:\"local:AgentProfile/3\") {id ... on AgentProfile {name}} }")
# result.data, result.errors
# schema.execute("query {agentProfiles {edges { node {id name}}} }")
# This fails:
# schema.execute("query {agentProfiles {edges { node {id name   ... on User {preferredEmail}}}} }")
# schema.execute("query {agentProfiles(id:\"local:AgentProfile/3\") {id name} }")
