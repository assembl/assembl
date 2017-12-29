import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
# from pyramid.httpexceptions import HTTPUnauthorized
# from pyramid.security import Everyone

from assembl import models
# from assembl.auth import IF_OWNED, CrudPermissions
# from assembl.auth.util import get_permissions

from .langstring import (
    LangStringEntry, LangStringEntryInput,
    resolve_langstring, resolve_langstring_entries,
    update_langstring_from_input_entries)
from .types import SecureObjectType
from .utils import abort_transaction_on_exception

resolve_prefix = "resolve_"
entries_suffix = "_entries"


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


class VoteSession(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.VoteSession
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    sub_title = graphene.String(lang=graphene.String())
    sub_title_entries = graphene.List(LangStringEntry)
    header_img_url = graphene.String()
    instructions_section_title = graphene.String(lang=graphene.String())
    instructions_section_title_entries = graphene.List(LangStringEntry)
    instructions_section_content = graphene.String(lang=graphene.String())
    instructions_section_content_entries = graphene.List(LangStringEntry)
    propositions_section_title = graphene.String(lang=graphene.String())
    propositions_section_title_entries = graphene.List(LangStringEntry)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.discussion_phase.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self.discussion_phase, 'title')

    def resolve_sub_title(self, args, context, info):
        return resolve_langstring(self.discussion_phase.description, args.get('lang'))

    def resolve_sub_title_entries(self, args, context, info):
        return resolve_langstring_entries(self.discussion_phase, 'description')

    def resolve_header_img_url(self, args, context, info):
        return self.discussion_phase.image_url

    def resolve_instructions_section_title(self, args, context, info):
        return resolve_langstring(self.instructions_section_title, args.get('lang'))

    def resolve_instructions_section_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'instructions_section_title')

    def resolve_instructions_section_content(self, args, context, info):
        return resolve_langstring(self.instructions_section_content, args.get('lang'))

    def resolve_instructions_section_content_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'instructions_section_content')

    def resolve_propositions_section_title(self, args, context, info):
        return resolve_langstring(self.propositions_section_title, args.get('lang'))

    def resolve_propositions_section_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'propositions_section_title')


vote_session_langstrings = [
    "instructions_section_title",
    "instructions_section_content",
    "propositions_section_title"
]

discussion_phase_langstrings = [
    "title",
    "description"
]

input_langstrings_names = ["title", "sub_title"] + vote_session_langstrings


def attrs_dict(src, attrs_names):
    attrs = {}
    for attr_name in attrs_names:
        attrs[attr_name] = getattr(src, attr_name)
    return attrs


class UpdateVoteSession(graphene.Mutation):
    class Input:
        discussion_phase_id = graphene.Int(required=True)
        header_img_url = graphene.String()

    for langstring_name in input_langstrings_names:
        setattr(Input, langstring_name + entries_suffix, graphene.List(LangStringEntryInput))

    vote_session = graphene.Field(VoteSession)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        # user_id = context.authenticated_userid or Everyone
        # discussion_id = context.matchdict['discussion_id']

        # require_update_permission(models.DiscussionPhase, user_id, discussion_id) TODO: !!!

        discussion_phase_id = args.get('discussion_phase_id')
        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)

        if discussion_phase is None:
            raise Exception("A vote session requires a discussion phase, check discussionPhaseId value")
        if discussion_phase.identifier != "tokenVote":
            raise Exception("A vote session can only be created or edited with a tokenVote discussion phase, check discussionPhaseId value")

        vote_session = next(iter(discussion_phase.vote_session or []), None)
        if vote_session is None:
            vote_session = models.VoteSession(discussion_phase=discussion_phase)

        for name in vote_session_langstrings:
            update_langstring_from_input_entries(
                vote_session,
                name,
                args.get(name + entries_suffix)
            )
        add_and_flush(vote_session)

        title_entries = args.get('title' + entries_suffix)
        if title_entries is not None:
            update_langstring_from_input_entries(
                discussion_phase,
                'title',
                title_entries
            )
        sub_title_entries = args.get('sub_title' + entries_suffix)
        if sub_title_entries is not None:
            update_langstring_from_input_entries(
                discussion_phase,
                'description',
                sub_title_entries
            )
        discussion_phase.image_url = args.get('header_img_url')
        add_and_flush(discussion_phase)

        return UpdateVoteSession(vote_session=vote_session)
