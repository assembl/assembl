import os.path

import graphene

from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions

from .types import SecureObjectType
from .utils import abort_transaction_on_exception


class Document(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Document.__doc__

    class Meta:
        model = models.Document
        only_fields = ('id', 'title', 'mime_type')

    external_url = graphene.String(description=docs.Document.external_url)
    av_checked = graphene.String(description=docs.Document.av_checked)


class UploadDocument(graphene.Mutation):
    __doc__ = docs.UploadDocument.__doc__

    class Input:
        file = graphene.String(
            required=True,
            description=docs.UploadDocument.file
        )

    document = graphene.Field(lambda: Document)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone
        cls = models.Document
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        uploaded_file = args.get('file')
        if uploaded_file is not None:
            filename = os.path.basename(context.POST[uploaded_file].filename)
            mime_type = context.POST[uploaded_file].type
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename)
            document.add_file_data(context.POST[uploaded_file].file)
            discussion.db.add(document)
            document.db.flush()

        return UploadDocument(document=document)
