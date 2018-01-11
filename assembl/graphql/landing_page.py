# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from .langstring import (
    LangStringEntry, resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType


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
