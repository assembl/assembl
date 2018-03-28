import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl import models

from .types import SecureObjectType, SQLAlchemyInterface
from .utils import abort_transaction_on_exception, DateTime


class TextFragmentIdentifier(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.TextFragmentIdentifier
        interfaces = (Node,)
        only_fields = ('xpath_start', 'xpath_end', 'offset_start', 'offset_end')


class ExtractInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Extract
        only_fields = ('body', 'important', 'extract_nature', 'extract_action')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    text_fragment_identifiers = graphene.List(TextFragmentIdentifier)


class Extract(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Extract
        interfaces = (Node, ExtractInterface)
        only_fields = ('id')

    creation_date = DateTime()


class UpdateExtract(graphene.Mutation):
    class Input:
        extract_id = graphene.ID(required=True)
        idea_id = graphene.ID()
        important = graphene.Boolean()
        extract_nature = graphene.String()
        extract_action = graphene.String()

    extract = graphene.Field(lambda: Extract)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = models.Extract.user_can_cls(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        extract_id = args.get('extract_id')
        extract_id = int(Node.from_global_id(extract_id)[1])
        extract = models.Extract.get(extract_id)
        extract.important = args.get('important')
        extract.extract_action = args.get('extract_action')
        extract.extract_nature = args.get('extract_nature')
        if args.get('idea_id'):
            idea_id = int(Node.from_global_id(args.get('idea_id'))[1])
            extract.idea_id = idea_id

        return UpdateExtract(extract=extract)


class DeleteExtract(graphene.Mutation):
    class Input:
        extract_id = graphene.ID(required=True)

    extract = graphene.Field(lambda: Extract)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = models.Extract.user_can_cls(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        extract_id = args.get('extract_id')
        extract_id = int(Node.from_global_id(extract_id)[1])
        extract = models.Extract.get(extract_id)
        for fragment in extract.text_fragment_identifiers:
            fragment.delete()
        extract.delete()

        return DeleteExtract(extract=extract)
