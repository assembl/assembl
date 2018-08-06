import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions

from .document import Document
from .langstring import (
    LangStringEntry, LangStringEntryInput, langstring_from_input_entries,
    resolve_langstring, resolve_langstring_entries,
    update_langstring_from_input_entries)
from .types import SecureObjectType
from .utils import (
    abort_transaction_on_exception, get_attachment_with_purpose, create_attachment, update_attachment)


class Resource(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Resource.__doc__

    class Meta:
        model = models.Resource
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String(description=docs.Default.required_language_input))
    text = graphene.String(lang=graphene.String(description=docs.Default.required_language_input))
    title_entries = graphene.List(LangStringEntry, description=docs.Resource.title_entries)
    text_entries = graphene.List(LangStringEntry, description=docs.Resource.title_entries)
    embed_code = graphene.String(description=docs.Resource.embed_code)
    order = graphene.Float(description=docs.Resource.order)
    image = graphene.Field(Document, description=docs.Resource.image)
    doc = graphene.Field(Document, description=docs.Resource.doc)

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
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        image_file = get_attachment_with_purpose(self.attachments, ATTACHMENT_PURPOSE_IMAGE)
        if image_file:
            return image_file.document

    def resolve_doc(self, args, context, info):
        ATTACHMENT_PURPOSE_DOCUMENT = models.AttachmentPurpose.DOCUMENT.value
        doc_file = get_attachment_with_purpose(self.attachments, ATTACHMENT_PURPOSE_DOCUMENT)
        if doc_file:
            return doc_file.document


class CreateResource(graphene.Mutation):
    __doc__ = docs.CreateResource.__doc__

    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.CreateResource.title_entries)
        text_entries = graphene.List(LangStringEntryInput, description=docs.CreateResource.text_entries)
        embed_code = graphene.String(description=docs.CreateResource.embed_code)
        image = graphene.String(description=docs.CreateResource.image)
        doc = graphene.String(description=docs.CreateResource.doc)
        order = graphene.Float(description=docs.CreateResource.order)

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        ATTACHMENT_PURPOSE_DOCUMENT = models.AttachmentPurpose.DOCUMENT.value
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
            kwargs['order'] = args.get('order')
            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db = saobj.db
            db.add(saobj)

            image = args.get('image')
            if image is not None:
                new_attachment = create_attachment(
                    discussion,
                    models.ResourceAttachment,
                    image,
                    ATTACHMENT_PURPOSE_IMAGE,
                    context
                )
                new_attachment.resource = saobj
                db.add(new_attachment)

            doc = args.get('doc')
            if doc is not None:
                new_attachment = create_attachment(
                    discussion,
                    models.ResourceAttachment,
                    doc,
                    ATTACHMENT_PURPOSE_DOCUMENT,
                    context
                )
                new_attachment.resource = saobj
                db.add(new_attachment)

            db.flush()

        return CreateResource(resource=saobj)


class DeleteResource(graphene.Mutation):
    __doc__ = docs.DeleteResource.__doc__

    class Input:
        resource_id = graphene.ID(required=True, description=docs.DeleteResource.resource_id)

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
    __doc__ = docs.UpdateResource.__doc__

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, description=docs.UpdateResource.title_entries)
        text_entries = graphene.List(LangStringEntryInput, description=docs.UpdateResource.text_entries)
        embed_code = graphene.String(description=docs.UpdateResource.embed_code)
        image = graphene.String(description=docs.UpdateResource.image)
        doc = graphene.String(description=docs.UpdateResource.doc)
        order = graphene.Float(description=docs.UpdateResource.order)

    resource = graphene.Field(lambda: Resource)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        ATTACHMENT_PURPOSE_DOCUMENT = models.AttachmentPurpose.DOCUMENT.value
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
            kwargs['order'] = args.get('order', resource.order)
            for attr, value in kwargs.items():
                setattr(resource, attr, value)

            db = resource.db

            # add uploaded image as an attachment to the resource
            image = args.get('image')
            if image is not None:
                update_attachment(
                    discussion,
                    models.ResourceAttachment,
                    image,
                    resource.attachments,
                    ATTACHMENT_PURPOSE_IMAGE,
                    db,
                    context
                )

            # add uploaded doc as an attachment to the resource
            doc = args.get('doc')
            if doc is not None:
                update_attachment(
                    discussion,
                    models.ResourceAttachment,
                    doc,
                    resource.attachments,
                    ATTACHMENT_PURPOSE_DOCUMENT,
                    db,
                    context
                )

            db.flush()

        return UpdateResource(resource=resource)
