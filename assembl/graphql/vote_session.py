import os

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.security import Everyone
from pyramid.httpexceptions import HTTPUnauthorized

from assembl import models
from assembl.auth.util import get_permissions
from assembl.auth import IF_OWNED, CrudPermissions
from .document import Document
from .graphql_langstrings_helpers import (
    langstrings_interface, update_langstrings, add_langstrings_input_attrs)
from .permissions_helpers import (
    require_cls_permission, require_instance_permission)
from .langstring import (
    LangStringEntry, LangStringEntryInput,
    langstring_from_input_entries,
    update_langstring_from_input_entries,
    resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType, SQLAlchemyUnion
from .utils import abort_transaction_on_exception


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
        interfaces = (Node, langstrings_interface(langstrings_defs, models.VoteSession.__name__))
        only_fields = ('id', 'discussion_phase_id')

    header_image = graphene.Field(Document)
    vote_specifications = graphene.List(lambda: VoteSpecificationUnion)

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
        discussion_phase_id = args.get('discussion_phase_id')
        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)

        if discussion_phase is None:
            raise Exception(
                "A vote session requires a discussion phase, check discussionPhaseId value")
        phase_identifier = "voteSession"
        if discussion_phase.identifier != phase_identifier:
            raise Exception(
                "A vote session can only be created or edited with a '{}' discussion phase, check discussionPhaseId value".format(phase_identifier))

        vote_session = discussion_phase.vote_session
        if vote_session is None:
            require_cls_permission(CrudPermissions.CREATE, models.VoteSession, context)
            vote_session = models.VoteSession(discussion_phase=discussion_phase)
        else:
            require_instance_permission(CrudPermissions.UPDATE, vote_session, context)

        db = vote_session.db

        update_langstrings(vote_session, langstrings_defs, args)

        image = args.get('header_image')
        if image is not None:
            filename = os.path.basename(context.POST[image].filename)
            mime_type = context.POST[image].type
            uploaded_file = context.POST[image].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            discussion_id = context.matchdict["discussion_id"]
            discussion = models.Discussion.get(discussion_id)
            ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
            images = [
                att for att in vote_session.attachments
                if att.attachmentPurpose == ATTACHMENT_PURPOSE_IMAGE]
            if images:
                image = images[0]
                db.delete(image.document)
                vote_session.attachments.remove(image)
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)
            models.VoteSessionAttachment(
                document=document,
                vote_session=vote_session,
                discussion=discussion,
                creator_id=context.authenticated_userid,
                title=filename,
                attachmentPurpose=ATTACHMENT_PURPOSE_IMAGE
            )

        db.add(vote_session)
        db.flush()

        return UpdateVoteSession(vote_session=vote_session)


class VoteSpecificationInterface(graphene.Interface):

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    instructions = graphene.String(lang=graphene.String())
    instructions_entries = graphene.List(LangStringEntry)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_instructions(self, args, context, info):
        return resolve_langstring(self.instructions, args.get('lang'))

    def resolve_instructions_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'instructions')


class TokenCategorySpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.TokenCategorySpecification
        interfaces = (Node,)
        only_fields = ('id', 'color', 'typename', 'total_number')

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.name, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'name')


class TokenVoteSpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.TokenVoteSpecification
        interfaces = (Node, VoteSpecificationInterface)
        only_fields = ('id', 'exclusive_categories')

    token_categories = graphene.List(TokenCategorySpecification)
    vote_session_id = graphene.ID(required=True)

    def resolve_vote_session_id(self, args, context, info):
        return Node.to_global_id('VoteSession', self.vote_session_id)


class VoteSpecificationUnion(SQLAlchemyUnion):
    class Meta:
        types = (TokenVoteSpecification, )
        model = models.AbstractVoteSpecification

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.TokenVoteSpecification):
            return TokenVoteSpecification


class TokenCategorySpecificationInput(graphene.InputObjectType):
    id = graphene.ID()
    title_entries = graphene.List(LangStringEntryInput, required=True)
    total_number = graphene.Int(required=True)
    typename = graphene.String()
    color = graphene.String(required=True)


class CreateTokenVoteSpecification(graphene.Mutation):

    class Input:
        vote_session_id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        exclusive_categories = graphene.Boolean(required=True)
        token_categories = graphene.List(TokenCategorySpecificationInput, required=True)

    token_vote_specification = graphene.Field(lambda: TokenVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TokenVoteSpecification
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        vote_session_id = args.get('vote_session_id')
        vote_session_id = int(Node.from_global_id(vote_session_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        exclusive_categories = args.get('exclusive_categories')
        token_categories = args.get('token_categories')

        with cls.default_db.no_autoflush as db:
            vote_session = db.query(models.VoteSession).get(vote_session_id)
            permissions = get_permissions(user_id, discussion_id)
            allowed = cls.user_can_cls(
                user_id, CrudPermissions.CREATE, permissions)
            if not allowed or (allowed == IF_OWNED and user_id == Everyone):
                raise HTTPUnauthorized()

            title_ls = langstring_from_input_entries(title_entries)
            instructions_ls = langstring_from_input_entries(instructions_entries)
            saobj = cls(
                title=title_ls,
                instructions=instructions_ls,
                exclusive_categories=exclusive_categories
            )
            for idx, token_category in enumerate(token_categories):
                title_ls = langstring_from_input_entries(
                    token_category.get('title_entries', None))
                total_number = token_category.get('total_number')
                typename = token_category.get('typename', 'category{}'.format(idx + 1))
                color = token_category.get('color')

                saobj.token_categories.append(
                    models.TokenCategorySpecification(
                        total_number=total_number,
                        typename=typename, name=title_ls,
                        color=color)
                )
            db.add(saobj)
            vote_session.vote_specifications.append(saobj)
            db.flush()

        return CreateTokenVoteSpecification(token_vote_specification=saobj)


class UpdateTokenVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        exclusive_categories = graphene.Boolean(required=True)
        token_categories = graphene.List(TokenCategorySpecificationInput, required=True)

    token_vote_specification = graphene.Field(lambda: TokenVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TokenVoteSpecification
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        token_vote_spec_id = args.get('id')
        token_vote_spec_id = int(Node.from_global_id(token_vote_spec_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        exclusive_categories = args.get('exclusive_categories')
        token_categories = args.get('token_categories')

        with cls.default_db.no_autoflush as db:
            toke_vote_spec = cls.get(token_vote_spec_id)
            permissions = get_permissions(user_id, discussion_id)
            allowed = toke_vote_spec.user_can(
                user_id, CrudPermissions.UPDATE, permissions)
            if not allowed:
                raise HTTPUnauthorized()

            update_langstring_from_input_entries(
                toke_vote_spec, 'title', title_entries)
            update_langstring_from_input_entries(
                toke_vote_spec, 'instructions', instructions_entries)
            toke_vote_spec.exclusive_categories = exclusive_categories
            existing_token_categories = {
                token_category.id: token_category for token_category in toke_vote_spec.token_categories}
            updated_token_categories = set()
            for idx, token_category_input in enumerate(token_categories):
                if token_category_input.get('id', None) is not None:
                    id_ = int(Node.from_global_id(token_category_input['id'])[1])
                    updated_token_categories.add(id_)
                    token_category = models.TokenCategorySpecification.get(id_)
                    update_langstring_from_input_entries(
                        token_category, 'name', token_category_input['title_entries'])
                    token_category.total_number = token_category_input.get('total_number')
                    token_category.typename = token_category_input.get('typename', 'category{}'.format(idx + 1))
                    token_category.color = token_category_input.get('color')
                else:
                    title_ls = langstring_from_input_entries(
                        token_category_input.get('title_entries', None))
                    total_number = token_category_input.get('total_number')
                    typename = token_category_input.get('typename', 'category{}'.format(idx + 1))
                    color = token_category_input.get('color')
                    toke_vote_spec.token_categories.append(
                        models.TokenCategorySpecification(
                            total_number=total_number,
                            typename=typename, name=title_ls,
                            color=color)
                    )

            # remove token categories that are not in token_categories input
            for token_category_id in set(existing_token_categories.keys()
                                   ).difference(updated_token_categories):
                db.delete(existing_token_categories[token_category_id])

            db.flush()

        return UpdateTokenVoteSpecification(token_vote_specification=toke_vote_spec)


class DeleteTokenVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        token_id = args.get('id')
        token_id = int(Node.from_global_id(token_id)[1])
        token = models.TokenVoteSpecification.get(token_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = token.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        token.db.delete(token)
        token.db.flush()
        return DeleteTokenVoteSpecification(success=True)
