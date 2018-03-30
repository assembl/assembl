import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl.auth import CrudPermissions
from assembl import models

from .permissions_helpers import require_instance_permission
from .types import SecureObjectType, SQLAlchemyInterface
from .utils import abort_transaction_on_exception, DateTime
from .user import AgentProfile


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
    creator_id = graphene.Int()
    creator = graphene.Field(lambda: AgentProfile)

    def resolve_creator(self, args, context, info):
        if self.creator_id is not None:
            return models.AgentProfile.get(self.creator_id)


class UpdateExtract(graphene.Mutation):
    class Input:
        extract_id = graphene.ID(required=True)
        idea_id = graphene.ID()
        important = graphene.Boolean()
        extract_nature = graphene.String()
        extract_action = graphene.String()
        body = graphene.String()

    extract = graphene.Field(lambda: Extract)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        extract_id = args.get('extract_id')
        extract_id = int(Node.from_global_id(extract_id)[1])
        extract = models.Extract.get(extract_id)
        require_instance_permission(CrudPermissions.UPDATE, extract, context)
        extract.important = args.get('important', False)
        extract.extract_action = getattr(
            models.ExtractActionVocabulary.Enum, args.get('extract_action', ''), None)
        extract.extract_nature = getattr(
            models.ExtractNatureVocabulary.Enum, args.get('extract_nature', ''), None)
        extract.body = args.get('body', None)
        if args.get('idea_id'):
            idea_id = int(Node.from_global_id(args.get('idea_id'))[1])
            extract.idea_id = idea_id
        extract.db.flush()

        return UpdateExtract(extract=extract)


class DeleteExtract(graphene.Mutation):
    class Input:
        extract_id = graphene.ID(required=True)

    extract = graphene.Field(lambda: Extract)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        extract_id = args.get('extract_id')
        extract_id = int(Node.from_global_id(extract_id)[1])
        extract = models.Extract.get(extract_id)
        require_instance_permission(CrudPermissions.DELETE, extract, context)
        for fragment in extract.text_fragment_identifiers:
            fragment.delete()
        extract.delete()
        extract.db.flush()

        return DeleteExtract(success=True)
