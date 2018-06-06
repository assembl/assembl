# -*- coding=utf-8 -*-
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from assembl.auth import CrudPermissions
from .langstring import LangStringEntry, LangStringEntryInput, resolve_langstring, resolve_langstring_entries, langstring_from_input_entries
from .permissions_helpers import require_cls_permission
from .types import SecureObjectType
from .utils import DateTime, abort_transaction_on_exception


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


class CreateDiscussionPhase(graphene.Mutation):
    class Input:
        lang = graphene.String(required=True)
        identifier = graphene.String(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        start = DateTime(required=True)
        end = DateTime(required=True)

    discussion_phase = graphene.Field(lambda: DiscussionPhase)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.DiscussionPhase
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        discussion_id = context.matchdict['discussion_id']
        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'DiscussionPhase titleEntries needs at least one entry')

            title_langstring = langstring_from_input_entries(title_entries)
            saobj = cls(
                discussion_id=discussion_id,
                identifier=args.get('identifier'),
                title=title_langstring,
                start=args.get('start'),
                end=args.get('end'))

            db.add(saobj)
            db.flush()

        return CreateDiscussionPhase(discussion_phase=saobj)
