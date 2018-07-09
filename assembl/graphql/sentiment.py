import graphene
from graphene.relay import Node
from graphene.pyutils.enum import Enum as PyEnum
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions

from assembl import models
from .utils import abort_transaction_on_exception
from assembl.models.action import (
    SentimentOfPost,
    LikeSentimentOfPost, DisagreeSentimentOfPost,
    DontUnderstandSentimentOfPost, MoreInfoSentimentOfPost)
import assembl.graphql.docstrings as docs


sentiments_enum = PyEnum('SentimentTypes', (
    ('LIKE', 'LIKE'),
    ('DISAGREE', 'DISAGREE'),
    ('DONT_UNDERSTAND', 'DONT_UNDERSTAND'),
    ('MORE_INFO', 'MORE_INFO')))
SentimentTypes = graphene.Enum.from_enum(sentiments_enum)


class SentimentCounts(graphene.ObjectType):
    __doc__ = docs.SentimentCounts.__doc__

    dont_understand = graphene.Int(description=docs.SentimentCounts.dont_understand)
    disagree = graphene.Int(description=docs.SentimentCounts.disagree)
    like = graphene.Int(description=docs.SentimentCounts.like)
    more_info = graphene.Int(description=docs.SentimentCounts.more_info)


class AddSentiment(graphene.Mutation):
    __doc__ = docs.AddSentiment.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.AddSentiment.post_id)
        type = graphene.Argument(
            type=SentimentTypes,
            required=True, description=docs.AddSentiment.type
        )

    post = graphene.Field('assembl.graphql.post.Post')

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Content.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = SentimentOfPost.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        sentiment_type = args.get('type')
        if SentimentTypes.LIKE.name == sentiment_type:
            sentiment = LikeSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.DISAGREE.name == sentiment_type:
            sentiment = DisagreeSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.DONT_UNDERSTAND.name == sentiment_type:
            sentiment = DontUnderstandSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)
        elif SentimentTypes.MORE_INFO.name == sentiment_type:
            sentiment = MoreInfoSentimentOfPost(
                post=post, discussion=discussion, actor_id=user_id)

        sentiment = sentiment.handle_duplication(
            permissions=permissions, user_id=user_id)
        sentiment.db.add(sentiment)
        sentiment.db.flush()
        return AddSentiment(post=post)


class DeleteSentiment(graphene.Mutation):
    __doc__ = docs.DeleteSentiment.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.DeleteSentiment.post_id)

    post = graphene.Field('assembl.graphql.post.Post')

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Content.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.my_sentiment.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        post.my_sentiment.is_tombstone = True
        post.db.flush()
        return DeleteSentiment(post=post)
