import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene.pyutils.enum import Enum as PyEnum

from assembl import models
import assembl.graphql.docstrings as docs
from assembl.auth import CrudPermissions
from assembl.graphql.langstring import LangStringEntryInput, langstring_from_input_entries
from assembl.graphql.permissions_helpers import require_cls_permission
from assembl.graphql.utils import abort_transaction_on_exception, create_attachment, get_attachment_with_purpose
from assembl.models import LangString, FullTextSynthesis
from assembl.models.idea_graph_view import FULLTEXT_SYNTHESIS_TYPE, STRUCTURED_SYNTHESIS_TYPE
from .document import Document
from .idea import IdeaUnion
from .langstring import (
    LangStringEntry, resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType
from .utils import DateTime


synthesis_type_enum = PyEnum('SynthesisTypes', (
    (models.idea_graph_view.STRUCTURED_SYNTHESIS_TYPE, models.idea_graph_view.STRUCTURED_SYNTHESIS_TYPE),
    (models.idea_graph_view.FULLTEXT_SYNTHESIS_TYPE, models.idea_graph_view.FULLTEXT_SYNTHESIS_TYPE),
))
SynthesisTypes = graphene.Enum.from_enum(synthesis_type_enum)


class Synthesis(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Synthesis.__doc__

    class Meta:
        model = models.Synthesis
        interfaces = (Node,)
        only_fields = ('id',)

    subject = graphene.String(lang=graphene.String(), description=docs.Synthesis.subject)
    subject_entries = graphene.List(LangStringEntry, description=docs.Synthesis.subject_entries)
    introduction = graphene.String(lang=graphene.String(), description=docs.Synthesis.introduction)
    introduction_entries = graphene.List(LangStringEntry, description=docs.Synthesis.introduction_entries)
    body = graphene.String(lang=graphene.String(), description=docs.Synthesis.body)
    body_entries = graphene.List(LangStringEntry, description=docs.Synthesis.body_entries)
    conclusion = graphene.String(lang=graphene.String(), description=docs.Synthesis.conclusion)
    conclusion_entries = graphene.List(LangStringEntry, description=docs.Synthesis.conclusion_entries)
    ideas = graphene.List(lambda: IdeaUnion, description=docs.Synthesis.ideas)
    img = graphene.Field(Document, description=docs.Synthesis.img)
    creation_date = DateTime(description=docs.Synthesis.creation_date)
    post = graphene.Field("assembl.graphql.post.Post", description=docs.Synthesis.post)
    synthesis_type = graphene.Field(
        type=SynthesisTypes,
        required=True,
        description=docs.Synthesis.synthesis_type,
    )

    def resolve_subject(self, args, context, info):
        return resolve_langstring(self.subject, args.get('lang'))

    def resolve_subject_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'subject')

    def resolve_introduction(self, args, context, info):
        return resolve_langstring(self.introduction, args.get('lang'))

    def resolve_introduction_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'introduction')

    def resolve_body(self, args, context, info):
        return resolve_langstring(self.body, args.get('lang'))

    def resolve_body_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'body')

    def resolve_conclusion(self, args, context, info):
        return resolve_langstring(self.conclusion, args.get('lang'))

    def resolve_conclusion_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'conclusion')

    def resolve_ideas(self, args, context, info):
        return self.get_ideas()

    def resolve_img(self, args, context, info):
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        image_file = get_attachment_with_purpose(self.published_in_post.attachments, ATTACHMENT_PURPOSE_IMAGE)
        if image_file:
            return image_file.document
        else:
            ideas = self.get_ideas()
            last_idea = ideas[-1].live if ideas else None
            if last_idea and last_idea.attachments:
                return last_idea.attachments[0].document

    def resolve_post(self, args, context, info):
        return self.published_in_post

    def resolve_synthesis_type(self, args, context, info):
        if isinstance(self, FullTextSynthesis):
            return FULLTEXT_SYNTHESIS_TYPE
        else:
            return STRUCTURED_SYNTHESIS_TYPE


class CreateSynthesis(graphene.Mutation):
    __doc__ = docs.CreateSynthesis.__doc__

    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        synthesis_type = graphene.Argument(
            type=SynthesisTypes,
            required=True,
            description=docs.CreateSynthesis.synthesis_type,
        )
        body_entries = graphene.List(LangStringEntryInput, required=True, description=docs.CreateSynthesis.body_entries)
        subject_entries = graphene.List(LangStringEntryInput, required=True,
                                        description=docs.CreateSynthesis.subject_entries)
        image = graphene.String(description=docs.CreateSynthesis.image)

    synthesis_post = graphene.Field('assembl.graphql.post.Post')

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        if args.get('synthesis_type') == models.idea_graph_view.FULLTEXT_SYNTHESIS_TYPE:
            cls = models.FullTextSynthesis
        else:
            cls = models.Synthesis

        post_cls = models.SynthesisPost

        discussion = models.Discussion.get(context.matchdict['discussion_id'])

        require_cls_permission(CrudPermissions.CREATE, cls, context)

        with cls.default_db.no_autoflush as db:
            kwargs = {}
            user_id = context.authenticated_userid
            body_langstring = langstring_from_input_entries(
                args.get('body_entries')
            )
            if body_langstring is not None:
                kwargs['body'] = body_langstring

            subject_langstring = langstring_from_input_entries(
                args.get('subject_entries')
            )
            if subject_langstring is not None:
                kwargs['subject'] = subject_langstring

            introduction_langstring = langstring_from_input_entries(
                args.get('introduction_entries')
            )
            kwargs['introduction'] = introduction_langstring or LangString.EMPTY()

            conclusion_langstring = langstring_from_input_entries(
                args.get('conclusion_entries')
            )
            kwargs['conclusion'] = conclusion_langstring or LangString.EMPTY()

            post_saobj = post_cls(
                discussion=discussion,
                creator_id=user_id,
                publishes_synthesis=cls(
                    discussion=discussion,
                    **kwargs
                ))
            db.add(post_saobj)

            image = args.get('image')
            if image is not None:
                new_attachment = create_attachment(
                    discussion,
                    models.PostAttachment,
                    models.AttachmentPurpose.IMAGE.value,
                    context,
                    new_value=image
                )
                new_attachment.post = post_saobj
                db.add(new_attachment)

            db.flush()

        return CreateSynthesis(synthesis_post=post_saobj)
