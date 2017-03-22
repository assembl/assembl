from collections import OrderedDict

from sqlalchemy.orm.exc import NoResultFound
import six
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene_sqlalchemy.converter import (
    convert_column_to_string, convert_sqlalchemy_type)
from graphene_sqlalchemy.utils import get_query, is_mapped
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import authenticated_userid, Everyone
from pyramid.threadlocal import get_current_request

from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl.lib.sqla_types import EmailString
from assembl import models
from .types import SQLAlchemyInterface, SQLAlchemyUnion

convert_sqlalchemy_type.register(EmailString)(convert_column_to_string)
models.Base.query = models.Base.default_db.query_property()


class SecureObjectType(object):

    @classmethod
    def get_node(cls, id, context, info):
        try:
            result = cls.get_query(context).get(id)
        except NoResultFound:
            return None

        request = get_current_request()
        discussion_id = context['discussion_id']
        user_id = authenticated_userid(request) or Everyone
        permissions = get_permissions(user_id, discussion_id)
        if not result.user_can(user_id, CrudPermissions.READ, permissions):
            raise HTTPUnauthorized()

        return result

# For security, always use only_fields in the Meta class to be sure we don't
# expose every fields and relations. You need at least only_fields = ('id', )
# to take effect.
# Auto exposing everything will automatically convert relations
# like AgentProfile.posts_created and create dynamically the
# object types Post, PostConnection which will conflict with those added
# manually.


class AgentProfile(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.AgentProfile
        interfaces = (Node, )
        only_fields = ('id', 'name')


# class User(AgentProfile):
#     class Meta:
#         model = models.User
#         interfaces = (Node, )
#         only_fields = ('id', 'name')  # preferredEmail


class SentimentCounts(graphene.ObjectType):
    dont_understand = graphene.Int()
    disagree = graphene.Int()
    like = graphene.Int()
    more_info = graphene.Int()


class PostInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Post
        only_fields = ('creation_date', 'creator')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    subject = graphene.String(lang=graphene.String())
    body = graphene.String(lang=graphene.String())
    sentiment_counts = graphene.Field(SentimentCounts)

    def resolve_subject(self, args, context, info):
        subject = self.get_subject().best_lang().value
        return subject

    def resolve_body(self, args, context, info):
        body = self.get_body().best_lang().value
        return body

    def resolve_sentiment_counts(self, args, context, info):
        sentiment_counts = self.sentiment_counts
        return SentimentCounts(
            dont_understand=sentiment_counts['dont_understand'],
            disagree=sentiment_counts['disagree'],
            like=sentiment_counts['like'],
            more_info=sentiment_counts['more_info'],
        )


class Post(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Post
        interfaces = (Node, PostInterface)
        only_fields = ('id', )  # inherits fields from Post interface only


class PropositionPost(Post):
    class Meta:
        model = models.PropositionPost
        interfaces = (Node, PostInterface)
        only_fields = ('id', )  # inherits fields from Post interface only


class PostUnion(SQLAlchemyUnion):
    class Meta:
        types = (PropositionPost, Post)
        model = models.Post

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.PropositionPost): # must be above Post
            return PropositionPost
        elif isinstance(instance, models.Post):
            return Post


class PostConnection(graphene.Connection):
    class Meta:
        node = PostUnion


class Video(graphene.ObjectType):
    title = graphene.String()
    description = graphene.String()
    html_code = graphene.String()


class Idea(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Idea
        interfaces = (Node, )
        only_fields = ('id', )


class Question(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Question
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    posts = graphene.List(PropositionPost)

    def resolve_title(self, args, context, info):
        title = self.title.best_lang().value
        return title

    def resolve_posts(self, args, context, info):
        # TODO
        return []


class Thematic(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Thematic
        interfaces = (Node, )
        only_fields = ('id', 'identifier')

    title = graphene.String(lang=graphene.String())
    description = graphene.String(lang=graphene.String())
    questions = graphene.List(Question)
    video = graphene.Field(Video)
    img_url = graphene.String()
    num_posts = graphene.Int()
    num_contributors = graphene.Int()

    def resolve_title(self, args, context, info):
        title = self.title.best_lang().value
        return title

    def resolve_description(self, args, context, info):
        description = self.description
        description = description.best_lang().value if description is not None else None
        return description

    def resolve_questions(self, args, context, info):
        return self.get_children()

    def resolve_video(self, args, context, info):
        title = self.video_title
        title = title.best_lang().value if title is not None else None
        description = self.video_description
        description = description.best_lang().value if description is not None else None
        return Video(
            title=title,
            description=description,
            html_code=self.video_html_code,
        )

    def resolve_img_url(self, args, context, info):
        # TODO imgUrl
        return ""


class Query(graphene.ObjectType):
    node = Node.Field()
    posts = SQLAlchemyConnectionField(PostConnection)#, idea_id=graphene.ID())
    # ideas = SQLAlchemyConnectionField(Idea)
    thematics = graphene.List(Thematic, identifier=graphene.String())
    # agent_profiles = SQLAlchemyConnectionField(AgentProfile)

    def resolve_ideas(self, args, context, info):
        # TODO do we need to do a special query to only retrieve ideas
        # associated to the RootIdea?
        connection_type = info.return_type.graphene_type  # this is IdeaConnection
        model = connection_type._meta.node._meta.model  # this is models.Idea
        query = get_query(model, context)
        discussion_id = context['discussion_id']
        query = query.filter(model.discussion_id == discussion_id
            ).filter(model.hidden == False
            ).filter(model.tombstone_condition())

        # pagination is done after that, no need to do it ourself
        return query

    def resolve_posts(self, args, context, info):
        connection_type = info.return_type.graphene_type  # this is PostConnection
        model = connection_type._meta.node._meta.model  # this is models.PostUnion
        query = get_query(model, context)
        discussion_id = context['discussion_id']
        query = query.filter(model.discussion_id == discussion_id
            ).filter(model.hidden == False
            ).filter(model.tombstone_condition()
            ).filter(model.publication_state == models.PublicationStates.PUBLISHED)

        # TODO filter posts for a specific idea
        # idea_id = args.get('idea_id', None)
        # if idea_id is not None:
        #     id_ = int(Node.from_global_id(idea_id)[1])
        #     query = query.filter(model.idea_content_links? idea_id? == id_)

        # pagination is done after that, no need to do it ourself
        return query

    def resolve_thematics(self, args, context, info):
        identifier = args.get('identifier', None)
        model = Thematic._meta.model
        discussion_id = context['discussion_id']
        query = get_query(model, context
            ).filter(model.discussion_id == discussion_id)
        if identifier is not None:
            query = query.filter(model.identifier == identifier)

        return query


Schema = graphene.Schema(query=Query)

"""
$ pshell local.ini
import json
from assembl.graphql.schema import Schema as schema

#print the schema as text:
print str(schema)

#schema.execute returns a ExecutionResult object with data and errors attributes on it.

#get node:
print json.dumps(schema.execute('query { node(id:"UG9zdDoyMzU5") { ... on Post { id, creator { name } } } }', context_value={"discussion_id": 16}).data, indent=2)

#get ideas:
print json.dumps(schema.execute('query { ideas(first: 5) { pageInfo { endCursor hasNextPage } edges { node { id } } } }', context_value={"discussion_id": 16}).data, indent=2)

#get posts:
print json.dumps(schema.execute('query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on Post {id, creator { name }, subject, body, sentimentCounts {dontUnderstand disagree like moreInfo }} } } } }', context_value={"discussion_id": 16}).data, indent=2)
# curl --silent -XPOST -H "Content-Type:application/json" -d '{ "query": "query { posts(first: 5) { pageInfo { endCursor hasNextPage } edges { node { ... on Post {id, creator { name }} } } } }" }' http://localhost:6543/sandbox/graphql

#get thematics with questions:
print json.dumps(schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title } } }', context_value={"discussion_id": 16}).errors, indent=2)

"""

