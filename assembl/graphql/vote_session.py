import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from assembl import models

from .types import SecureObjectType
from .utils import abort_transaction_on_exception
from .graphql_langstrings_helpers import (GraphQLLangstringsMixin,
                                          update_langstrings, add_langstrings_input_attrs)

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
    "instructions_section_title": {},
    "instructions_section_content": {},
    "propositions_section_title": {},
    "title": {
        "relation_name": "discussion_phase"
    },
    "sub_title": {
        "relation_name": "discussion_phase",
        "target_name": "description"
    }
}


class VoteSession(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.VoteSession
        interfaces = (Node, GraphQLLangstringsMixin(langstrings_defs))
        only_fields = ('id', )

    header_img_url = graphene.String()

    def resolve_header_img_url(self, args, context, info):
        return self.discussion_phase.image_url


class UpdateVoteSession(graphene.Mutation):
    class Input:
        discussion_phase_id = graphene.Int(required=True)
        header_img_url = graphene.String()

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
        if discussion_phase.identifier != "tokenVote":
            raise Exception(
                "A vote session can only be created or edited with a tokenVote discussion phase, check discussionPhaseId value")

        # TODO: see if we can avoid this next(iter( thing with a one-to-one relationship
        vote_session = next(iter(discussion_phase.vote_session or []), None)
        if vote_session is None:
            vote_session = models.VoteSession(
                discussion_phase=discussion_phase)

        update_langstrings(vote_session, langstrings_defs, args)
        add_and_flush(vote_session)

        discussion_phase.image_url = args.get('header_img_url')
        add_and_flush(discussion_phase)

        return UpdateVoteSession(vote_session=vote_session)
