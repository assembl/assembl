import graphene
from graphene.pyutils.enum import Enum as PyEnum
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

import assembl.graphql.docstrings as docs
from assembl.auth import CrudPermissions
from assembl import models

from .permissions_helpers import require_instance_permission
from .types import SecureObjectType, SQLAlchemyInterface
from .utils import abort_transaction_on_exception, DateTime
from .user import AgentProfile


ExtractStates = graphene.Enum.from_enum(models.ExtractStates)

extract_natures_enum = PyEnum(
    'ExtractNatures', [(k.name, k.value) for k in models.ExtractNatureVocabulary.Enum])

ExtractNatures = graphene.Enum.from_enum(extract_natures_enum)


class TextFragmentIdentifier(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.TextFragmentIdentifier.__doc__

    class Meta:
        model = models.TextFragmentIdentifier
        interfaces = (Node,)
        only_fields = ('xpath_start', 'xpath_end', 'offset_start', 'offset_end')


class ExtractInterface(SQLAlchemyInterface):
    __doc__ = docs.ExtractInterface.__doc__

    class Meta:
        model = models.Extract
        only_fields = ('body', 'important', 'extract_nature', 'extract_action')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    text_fragment_identifiers = graphene.List(TextFragmentIdentifier,
                                              description=docs.ExtractInterface.text_fragment_identifiers)


class Extract(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.ExtractInterface.__doc__

    class Meta:
        model = models.Extract
        interfaces = (Node, ExtractInterface)
        only_fields = ('id')

    creation_date = DateTime(description=docs.ExtractInterface.creation_date)
    creator_id = graphene.Int(description=docs.ExtractInterface.creator_id)
    creator = graphene.Field(lambda: AgentProfile, description=docs.ExtractInterface.creator)
    extract_state = graphene.Field(type=ExtractStates, description=docs.ExtractInterface.extract_state)
    lang = graphene.String(description=docs.ExtractInterface.lang)

    def resolve_creator(self, args, context, info):
        if self.creator_id is not None:
            return models.AgentProfile.get(self.creator_id)


class UpdateExtract(graphene.Mutation):
    __doc__ = docs.UpdateExtract.__doc__

    class Input:
        extract_id = graphene.ID(required=True, description=docs.UpdateExtract.extract_id)
        idea_id = graphene.ID(description=docs.UpdateExtract.idea_id)
        important = graphene.Boolean(description=docs.UpdateExtract.important)
        extract_nature = graphene.String(description=docs.UpdateExtract.extract_nature)
        extract_action = graphene.String(description=docs.UpdateExtract.extract_action)
        body = graphene.String(description=docs.UpdateExtract.body)

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
        body = args.get('body', None)
        if body:
            extract.body = body
        if args.get('idea_id'):
            idea_id = int(Node.from_global_id(args.get('idea_id'))[1])
            extract.idea_id = idea_id

        extract.db.flush()

        return UpdateExtract(extract=extract)


class DeleteExtract(graphene.Mutation):
    __doc__ = docs.DeleteExtract.__doc__

    class Input:
        extract_id = graphene.ID(required=True, description=docs.DeleteExtract.extract_id)

    success = graphene.Boolean(description=docs.DeleteExtract.success)

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


class ConfirmExtract(graphene.Mutation):
    class Input:
        extract_id = graphene.ID(required=True, description=docs.ConfirmExtract.extract_id)

    success = graphene.Boolean(description=docs.ConfirmExtract.success)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        extract_id = args.get('extract_id')
        extract_id = int(Node.from_global_id(extract_id)[1])
        extract = models.Extract.get(extract_id)
        require_instance_permission(CrudPermissions.UPDATE, extract, context)
        # Publish the extract
        extract.extract_state = models.ExtractStates.PUBLISHED.value
        extract.db.flush()
        return ConfirmExtract(success=True)
