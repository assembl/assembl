import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from assembl import models
import os

from .types import SecureObjectType
from .utils import abort_transaction_on_exception
from .graphql_langstrings_helpers import (
    LangstringsInterface,
    update_langstrings,
    add_langstrings_input_attrs
)
from .document import Document

# from assembl.auth import IF_OWNED, CrudPermissions
# from assembl.auth.util import get_permissions
# from pyramid.httpexceptions import HTTPUnauthorized
# from pyramid.security import Everyone


def add_and_flush(model):
    db = model.db
    db.add(model)
    db.flush()


"""

def require_permission(cls, user_id, discussion_id, permission):
    permissions = get_permissions(user_id, discussion_id)
    allowed = cls.user_can_cls(
        user_id, permission, permissions)
    if not allowed or (allowed == IF_OWNED and user_id == Everyone):
        raise HTTPUnauthorized()

def require_create_permission(cls, user_id, discussion_id):
    require_permission(cls, user_id, discussion_id, CrudPermissions.UPDATE)

def require_update_permission(cls, user_id, discussion_id):
    require_permission(cls, user_id, discussion_id, CrudPermissions.CREATE)

"""

langstrings_defs = {
    "title": {},
    "sub_title": {},
    "instructions_section_title": {},
    "instructions_section_content": {},
    "propositions_section_title": {}
}


class VoteSession(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.VoteSession
        interfaces = (Node, LangstringsInterface(langstrings_defs))
        only_fields = ('id', 'discussion_phase_id')

    header_image = graphene.Field(Document)

    def resolve_header_image(self, args, context, info):
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        for attachment in self.attachments:
            if attachment.attachmentPurpose == ATTACHMENT_PURPOSE_IMAGE:
                return attachment.document


class UpdateVoteSession(graphene.Mutation):
    class Input:
        discussion_phase_id = graphene.Int(required=True)
        header_image = graphene.String()

    add_langstrings_input_attrs(Input, langstrings_defs.keys())

    vote_session = graphene.Field(VoteSession)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        # user_id = context.authenticated_userid or Everyone
        # discussion_id = context.matchdict['discussion_id']
        # require_update_permission(models.DiscussionPhase, user_id, discussion_id) TODO: !!!
        # TODO: Persmissions !!

        discussion_phase_id = args.get('discussion_phase_id')
        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)

        if discussion_phase is None:
            raise Exception(
                "A vote session requires a discussion phase, check discussionPhaseId value")
        phase_slug = "voteSession"
        if discussion_phase.identifier != phase_slug:
            raise Exception(
                "A vote session can only be created or edited with a '{}' discussion phase, check discussionPhaseId value".format(phase_slug))

        # TODO: see if we can avoid this next(iter( thing with a one-to-one relationship
        vote_session = next(iter(discussion_phase.vote_session or []), None)
        if vote_session is None:
            vote_session = models.VoteSession(
                discussion_phase=discussion_phase)

        update_langstrings(vote_session, langstrings_defs, args)

        image = args.get('header_image')
        if image is not None:
            filename = os.path.basename(context.POST[image].filename)
            mime_type = context.POST[image].type
            uploaded_file = context.POST[image].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            discussion = vote_session.discussion
            ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            models.ResourceAttachment(
                document=document,
                resource=vote_session,
                discussion=discussion,
                creator_id=context.authenticated_userid,
                title=filename,
                attachmentPurpose=ATTACHMENT_PURPOSE_IMAGE
            )

        add_and_flush(vote_session)

        return UpdateVoteSession(vote_session=vote_session)
