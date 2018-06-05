# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from .types import SecureObjectType
from .utils import DateTime
from .langstring import LangStringEntry, resolve_langstring, resolve_langstring_entries


class DiscussionPhase(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.DiscussionPhase
        interfaces = (Node, )
        only_fields = ('id',)

    identifier = graphene.String()
    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    start = DateTime()
    end = DateTime()

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')
