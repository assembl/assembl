import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models

from .document import Document
from .idea import IdeaUnion
from .langstring import (
    LangStringEntry, resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType
from .utils import DateTime


class Synthesis(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Synthesis
        interfaces = (Node, )
        only_fields = ('id', )

    subject = graphene.String(lang=graphene.String())
    subject_entries = graphene.List(LangStringEntry)
    introduction = graphene.String(lang=graphene.String())
    introduction_entries = graphene.List(LangStringEntry)
    conclusion = graphene.String(lang=graphene.String())
    conclusion_entries = graphene.List(LangStringEntry)
    ideas = graphene.List(lambda: IdeaUnion)
    img = graphene.Field(Document)
    creation_date = DateTime()
    post = graphene.Field("assembl.graphql.post.Post")

    def resolve_subject(self, args, context, info):
        return resolve_langstring(self.subject, args.get('lang'))

    def resolve_subject_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'subject')

    def resolve_introduction(self, args, context, info):
        return resolve_langstring(self.introduction, args.get('lang'))

    def resolve_introduction_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'introduction')

    def resolve_conclusion(self, args, context, info):
        return resolve_langstring(self.conclusion, args.get('lang'))

    def resolve_conclusion_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'conclusion')

    def resolve_ideas(self, args, context, info):
        return self.get_ideas()

    def resolve_img(self, args, context, info):
        ideas = self.get_ideas()
        last_idea = ideas[-1].live if ideas else None
        if last_idea.attachments:
            return last_idea.attachments[0].document

    def resolve_post(self, args, context, info):
        return self.published_in_post
