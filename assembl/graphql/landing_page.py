# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from .langstring import (
    LangStringEntry, resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType
from .utils import abort_transaction_on_exception
from assembl.auth.util import get_permissions
from assembl.auth import IF_OWNED, CrudPermissions
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone


class LandingPageModuleType(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.LandingPageModuleType
        interfaces = (Node, )
        only_fields = ('id', 'default_order', 'editable_order', 'identifier', 'required')

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    helper_img_url = graphene.String()

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')


class LandingPageModule(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.LandingPageModule
        interfaces = (Node, )
        only_fields = ('id', 'enabled', 'order', 'configuration')

    module_type = graphene.Field(LandingPageModuleType)
    exists_in_database = graphene.Boolean()

    def resolve_exists_in_database(self, args, context, info):
        return self.id > 0

    def resolve_id(self, args, context, info):
        if self.id < 0:
            # this is a temporary object we created manually in resolve_landing_page_modules
            return self.id
        else:
            # this is a SQLAlchemy object
            # we can't use super here, so we just copy/paste resolve_id method from SQLAlchemyObjectType class
            from graphene.relay import is_node
            graphene_type = info.parent_type.graphene_type
            if is_node(graphene_type):
                return self.__mapper__.primary_key_from_instance(self)[0]
            return getattr(self, graphene_type._meta.id, None)


class CreateLandingPageModule(graphene.Mutation):

    class Input:
        type_identifier = graphene.String()
        enabled = graphene.Boolean()
        order = graphene.Float()
        configuration = graphene.String()

    landing_page_module = graphene.Field(lambda: LandingPageModule)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):

        cls = models.LandingPageModule

        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        configuration = args.get('configuration')
        order = args.get('order')
        enabled = args.get('enabled')
        module_type_identifier = args.get('type_identifier')
        with cls.default_db.no_autoflush as db:
            module_type = db.query(models.LandingPageModuleType).filter(
                models.LandingPageModuleType.identifier == module_type_identifier).one()
            permissions = get_permissions(user_id, discussion_id)
            allowed = cls.user_can_cls(
                user_id, CrudPermissions.CREATE, permissions)
            if not allowed or (allowed == IF_OWNED and user_id == Everyone):
                raise HTTPUnauthorized()

            saobj = cls(
                discussion_id=discussion_id,
                configuration=configuration,
                order=order,
                enabled=enabled,
                module_type=module_type
            )
            db.add(saobj)
            db.flush()

        return CreateLandingPageModule(landing_page_module=saobj)


class UpdateLandingPageModule(graphene.Mutation):

    class Input:
        module_id = graphene.ID(required=True)
        enabled = graphene.Boolean()
        order = graphene.Float()
        configuration = graphene.String()

    landing_page_module = graphene.Field(lambda: LandingPageModule)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.LandingPageModule

        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        configuration = args.get('configuration')
        order = args.get('order')
        enabled = args.get('enabled')

        module_id = args.get('module_id')
        module_id = int(Node.from_global_id(module_id)[1])

        with cls.default_db.no_autoflush as db:
            module = db.query(models.LandingPageModule).filter(
                models.LandingPageModule.id == module_id).first()
            permissions = get_permissions(user_id, discussion_id)
            allowed = cls.user_can_cls(
                user_id, CrudPermissions.CREATE, permissions)
            if not allowed or (allowed == IF_OWNED and user_id == Everyone):
                raise HTTPUnauthorized()

            module.enabled = enabled
            module.order = order
            module.configuration = configuration

            db.flush()

        return UpdateLandingPageModule(landing_page_module=module)
