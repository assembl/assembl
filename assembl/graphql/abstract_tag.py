# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

import assembl.graphql.docstrings as docs
from assembl import models

from .types import SecureObjectType, SQLAlchemyInterface
from .permissions_helpers import require_cls_permission
from .utils import abort_transaction_on_exception
from assembl.auth import (CrudPermissions)


class AbstractTagInterface(SQLAlchemyInterface):
    __doc__ = docs.AbstractTagInterface.__doc__

    class Meta:
        model = models.AbstractTag
        only_fields = ('value', )
        # Don't add id in only_fields in an interface
        # will be just the primary key, not the base64 type:id

    value = graphene.String(required=True, description=docs.AbstractTagInterface.value)


class AbstractTag(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.AbstractTagInterface.__doc__

    class Meta:
        model = models.AbstractTag
        interfaces = (Node, AbstractTagInterface)


class AddTagOnPost(graphene.Mutation):
    __doc__ = docs.AddTagOnPost.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.AddTagOnPost.post_id)
        value = graphene.String(required=True, description=docs.AddTagOnPost.value)

    tags = graphene.List(lambda: AbstractTag)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        db = post.db

        require_cls_permission(CrudPermissions.CREATE, models.AbstractTag, context)

        value = args.get('value')
        tag = models.AbstractTag.get_tag(value, discussion_id, db)

        if tag not in [tag_on_post.abstract_tag for tag_on_post in post.abstract_tags]:
            association = models.TagOnPost()
            association.abstract_tag = tag
            association.post = post
            db.add(association)

        db.flush()

        return AddTagOnPost(tags=[tag_on_post.abstract_tag for tag_on_post in post.abstract_tags])


class DeleteTagOnPost(graphene.Mutation):
    __doc__ = docs.DeleteTagOnPost.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.DeleteTagOnPost.post_id)
        value = graphene.String(required=True, description=docs.DeleteTagOnPost.value)

    tags = graphene.List(lambda: AbstractTag)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        db = post.db

        require_cls_permission(CrudPermissions.DELETE, models.AbstractTag, context)

        value = args.get('value')
        tag = models.AbstractTag.get_tag(value, discussion_id, db)
        associations = [association for association in post.abstract_tags if association.abstract_tag == tag]

        if len(associations) > 0:
            associations[0].delete()
            post.abstract_tags.remove(associations[0])

        if len(tag.posts) == 0:
            tag.delete()

        db.flush()

        return DeleteTagOnPost(tags=[tag_on_post.abstract_tag for tag_on_post in post.abstract_tags])
