import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from graphene.relay import Node

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions
from assembl.models.section import SectionTypesEnum

from .langstring import (LangStringEntry, LangStringEntryInput,
                         langstring_from_input_entries, resolve_langstring,
                         resolve_langstring_entries,
                         update_langstring_from_input_entries)
from .types import SecureObjectType
from .utils import abort_transaction_on_exception

SectionTypes = graphene.Enum.from_enum(SectionTypesEnum)


class Section(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Section.__doc__

    class Meta:
        model = models.Section
        interfaces = (Node, )
        only_fields = ('id', 'section_type', 'order')

    title = graphene.String(lang=graphene.String(docs.Default.required_language_input),
                            description=docs.Section.title)
    title_entries = graphene.List(LangStringEntry, description=docs.Section.title_entries)
    url = graphene.String(description=docs.Section.url)

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')


class CreateSection(graphene.Mutation):
    __doc__ = docs.CreateSection.__doc__

    class Input:
        title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.CreateSection.title_entries)
        section_type = graphene.Argument(SectionTypes, description=docs.CreateSection.section_type)
        url = graphene.String(description=docs.CreateSection.url)
        order = graphene.Float(description=docs.CreateSection.order)

    section = graphene.Field(lambda: Section)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Section
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'Resource titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)

            kwargs = {}
            kwargs['section_type'] = args.get('section_type', 'CUSTOM')
            kwargs['url'] = args.get('url')
            kwargs['order'] = args.get('order', 10.0)
            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db.add(saobj)
            db.flush()

        return CreateSection(section=saobj)


class DeleteSection(graphene.Mutation):
    __doc__ = docs.DeleteSection.__doc__

    class Input:
        section_id = graphene.ID(required=True, description=docs.DeleteSection.section_id)

    success = graphene.Boolean()

    @staticmethod
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        section_id = args.get('section_id')
        section_id = int(Node.from_global_id(section_id)[1])
        section = models.Section.get(section_id)
        if section.section_type != SectionTypesEnum.CUSTOM.value:
            return DeleteSection(success=False)

        permissions = get_permissions(user_id, discussion_id)
        allowed = section.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        section.db.delete(section)
        section.db.flush()
        return DeleteSection(success=True)


class UpdateSection(graphene.Mutation):
    __doc__ = docs.UpdateSection.__doc__

    class Input:
        id = graphene.ID(required=True, description=docs.UpdateSection.id)
        title_entries = graphene.List(LangStringEntryInput, description=docs.UpdateSection.title_entries)
        url = graphene.String(description=docs.UpdateSection.url)
        order = graphene.Float(description=docs.UpdateSection.order)

    section = graphene.Field(lambda: Section)

    @staticmethod
    def mutate(root, args, context, info):
        cls = models.Section
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        section_id = args.get('id')
        section_id = int(Node.from_global_id(section_id)[1])
        section = cls.get(section_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = section.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception(
                    'section titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(
                section, 'title', title_entries)

            kwargs = {}
            kwargs['url'] = args.get('url', None)
            kwargs['order'] = args.get('order', 10.0)
            for attr, value in kwargs.items():
                setattr(section, attr, value)

            db.flush()

        return UpdateSection(section=section)
