import os.path

import graphene

from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions

from .types import SecureObjectType
from .utils import abort_transaction_on_exception


class Document(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Document
        only_fields = ('id', 'title', 'mime_type')

    external_url = graphene.String()


class UploadDocument(graphene.Mutation):
    class Input:
        file = graphene.String(
            required=True
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
            uploaded_file = context.POST[uploaded_file].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            document.db.flush()

        return UploadDocument(document=document)
