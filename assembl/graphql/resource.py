import os.path

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions

from .document import Document
from .langstring import (
    LangStringEntry, LangStringEntryInput, langstring_from_input_entries,
    resolve_langstring, resolve_langstring_entries,
    update_langstring_from_input_entries)
from .types import SecureObjectType
from .utils import abort_transaction_on_exception


class Resource(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Resource
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    text = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    text_entries = graphene.List(LangStringEntry)
    embed_code = graphene.String()
    image = graphene.Field(Document)
    doc = graphene.Field(Document)

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_text(self, args, context, info):
        text = resolve_langstring(self.text, args.get('lang'))
        return text

    def resolve_text_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'text')

    def resolve_image(self, args, context, info):
        for attachment in self.attachments:
            if attachment.attachmentPurpose == 'IMAGE':
                return attachment.document

    def resolve_doc(self, args, context, info):
        for attachment in self.attachments:
            if attachment.attachmentPurpose == 'DOCUMENT':
                return attachment.document


class CreateResource(graphene.Mutation):
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        text_entries = graphene.List(LangStringEntryInput)
        embed_code = graphene.String()
        image = graphene.String()
        doc = graphene.String()

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Resource
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'Resource titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            text_langstring = langstring_from_input_entries(
                args.get('text_entries'))
            kwargs = {}
            if text_langstring is not None:
                kwargs['text'] = text_langstring

            kwargs['embed_code'] = args.get('embed_code')
            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db = saobj.db
            db.add(saobj)

            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                models.ResourceAttachment(
                    document=document,
                    resource=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="IMAGE"
                )

            doc = args.get('doc')
            if doc is not None:
                filename = os.path.basename(context.POST[doc].filename)
                mime_type = context.POST[doc].type
                uploaded_file = context.POST[doc].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                models.ResourceAttachment(
                    document=document,
                    resource=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="DOCUMENT"
                )

            db.flush()

        return CreateResource(resource=saobj)


class DeleteResource(graphene.Mutation):
    class Input:
        resource_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        resource_id = args.get('resource_id')
        resource_id = int(Node.from_global_id(resource_id)[1])
        resource = models.Resource.get(resource_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = resource.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        resource.db.delete(resource)
        resource.db.flush()
        return DeleteResource(success=True)


class UpdateResource(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput)
        text_entries = graphene.List(LangStringEntryInput)
        embed_code = graphene.String()
        image = graphene.String()
        doc = graphene.String()

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Resource
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        resource_id = args.get('id')
        resource_id = int(Node.from_global_id(resource_id)[1])
        resource = cls.get(resource_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = resource.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception(
                    'Resource titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(
                resource, 'title', title_entries)
            update_langstring_from_input_entries(
                resource, 'text', args.get('text_entries'))
            kwargs = {}
            kwargs['embed_code'] = args.get('embed_code', None)
            for attr, value in kwargs.items():
                setattr(resource, attr, value)

            db = resource.db

            # add uploaded image as an attachment to the resource
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                # if there is already an IMAGE, remove it with the
                # associated document
                images = [
                    att for att in resource.attachments
                    if att.attachmentPurpose == 'IMAGE']
                if images:
                    image = images[0]
                    db.delete(image.document)
                    resource.attachments.remove(image)

                models.ResourceAttachment(
                    document=document,
                    discussion=discussion,
                    resource=resource,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="IMAGE"
                )

        # add uploaded doc as an attachment to the resource
        doc = args.get('doc')
        if doc is not None:
            filename = os.path.basename(context.POST[doc].filename)
            mime_type = context.POST[doc].type
            uploaded_file = context.POST[doc].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            # if there is already a DOCUMENT, remove it with the
            # associated document
            docs = [
                att for att in resource.attachments
                if att.attachmentPurpose == 'DOCUMENT']
            if docs:
                doc = docs[0]
                db.delete(doc.document)
                resource.attachments.remove(doc)

            models.ResourceAttachment(
                document=document,
                discussion=discussion,
                resource=resource,
                creator_id=context.authenticated_userid,
                title=filename,
                attachmentPurpose="DOCUMENT"
            )

            db.flush()

        return UpdateResource(resource=resource)
