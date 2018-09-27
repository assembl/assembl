import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
import assembl.graphql.docstrings as docs
from .document import Document
from .idea import IdeaUnion
from .langstring import (
    LangStringEntry, resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType
from .utils import DateTime


class Synthesis(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Synthesis.__doc__

    class Meta:
        model = models.Synthesis
        interfaces = (Node, )
        only_fields = ('id', )

    subject = graphene.String(lang=graphene.String(), description=docs.Synthesis.subject)
    subject_entries = graphene.List(LangStringEntry, description=docs.Synthesis.subject_entries)
    introduction = graphene.String(lang=graphene.String(), description=docs.Synthesis.introduction)
    introduction_entries = graphene.List(LangStringEntry, description=docs.Synthesis.introduction_entries)
    conclusion = graphene.String(lang=graphene.String(), description=docs.Synthesis.conclusion)
    conclusion_entries = graphene.List(LangStringEntry, description=docs.Synthesis.conclusion_entries)
    ideas = graphene.List(lambda: IdeaUnion, description=docs.Synthesis.ideas)
    img = graphene.Field(Document, description=docs.Synthesis.img)
    creation_date = DateTime(description=docs.Synthesis.creation_date)
    post = graphene.Field("assembl.graphql.post.Post", description=docs.Synthesis.post)

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
        if last_idea and last_idea.attachments:
            return last_idea.attachments[0].document

    def resolve_post(self, args, context, info):
        return self.published_in_post
