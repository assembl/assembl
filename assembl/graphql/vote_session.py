import os

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.sql import func

from assembl import models
from assembl.auth import CrudPermissions
from .document import Document
from .graphql_langstrings_helpers import (
    langstrings_interface, update_langstrings, add_langstrings_input_attrs)
from .permissions_helpers import (
    require_cls_permission, require_instance_permission)
from .idea import Idea
from .langstring import (
    LangStringEntry, LangStringEntryInput,
    langstring_from_input_entries,
    update_langstring_from_input_entries,
    resolve_langstring, resolve_langstring_entries)
from .types import SecureObjectType, SQLAlchemyUnion
from .utils import (
    abort_transaction_on_exception,
    get_root_thematic_for_phase,
    create_root_thematic)
import assembl.graphql.docstrings as docs

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

    header_image = graphene.Field(Document, description=docs.VoteSession.header_image)
    vote_specifications = graphene.List(lambda: VoteSpecificationUnion, required=True, description=docs.VoteSession.header_image)
    proposals = graphene.List(lambda: Idea, required=True, description=docs.VoteSession.proposals)
    see_current_votes = graphene.Boolean(required=True, description=docs.VoteSession.see_current_votes)

    def resolve_header_image(self, args, context, info):
        ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
        for attachment in self.attachments:
            if attachment.attachmentPurpose == ATTACHMENT_PURPOSE_IMAGE:
                return attachment.document

    def resolve_proposals(self, args, context, info):
        identifier = 'voteSession{}'.format(self.id)
        discussion_id = context.matchdict["discussion_id"]
        discussion = models.Discussion.get(discussion_id)
        root_thematic = get_root_thematic_for_phase(discussion, identifier)
        if root_thematic is None:
            return []

        return root_thematic.get_children()

    def resolve_vote_specifications(self, args, context, info):
        # return only vote specifications not associated to a proposal
        return [vote_spec for vote_spec in self.vote_specifications if vote_spec.criterion_idea_id is None]


class UpdateVoteSession(graphene.Mutation):

    class Input:
        discussion_phase_id = graphene.Int(required=True, description=docs.UpdateVoteSession.discussion_phase_id)
        header_image = graphene.String(description=docs.UpdateVoteSession.header_image)
        see_current_votes = graphene.Boolean(description=docs.UpdateVoteSession.see_current_votes)

    add_langstrings_input_attrs(Input, langstrings_defs.keys())

    vote_session = graphene.Field(VoteSession)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_phase_id = args.get('discussion_phase_id')
        discussion_phase = models.DiscussionPhase.get(discussion_phase_id)
        discussion_id = context.matchdict["discussion_id"]
        discussion = models.Discussion.get(discussion_id)

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
            vote_session = models.VoteSession(discussion=discussion, discussion_phase=discussion_phase)
        else:
            require_instance_permission(CrudPermissions.UPDATE, vote_session, context)

        if args.get('see_current_votes', None) is not None:
            vote_session.see_current_votes = args['see_current_votes']

        db = vote_session.db

        update_langstrings(vote_session, langstrings_defs, args)

        image = args.get('header_image')
        if image is not None:
            filename = os.path.basename(context.POST[image].filename)
            mime_type = context.POST[image].type
            ATTACHMENT_PURPOSE_IMAGE = models.AttachmentPurpose.IMAGE.value
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename)
            document.add_file_data(context.POST[image].file)
            images = [
                att for att in vote_session.attachments
                if att.attachmentPurpose == ATTACHMENT_PURPOSE_IMAGE]
            if images:
                image = images[0]
                image.document.delete_file()
                db.delete(image.document)
                vote_session.attachments.remove(image)
            db.add(models.VoteSessionAttachment(
                document=document,
                vote_session=vote_session,
                discussion=discussion,
                creator_id=context.authenticated_userid,
                title=filename,
                attachmentPurpose=ATTACHMENT_PURPOSE_IMAGE
            ))

        db.add(vote_session)

        # create the root thematic on which we will attach all proposals for this vote session
        identifier = 'voteSession{}'.format(vote_session.id)
        root_thematic = get_root_thematic_for_phase(discussion, identifier)
        if root_thematic is None:
            root_thematic = create_root_thematic(discussion, identifier)

        db.flush()
        return UpdateVoteSession(vote_session=vote_session)


class VoteSpecificationInterface(graphene.Interface):

    title = graphene.String(lang=graphene.String(), description=docs.VoteSpecificationInterface.title)
    title_entries = graphene.List(LangStringEntry, description=docs.VoteSpecificationInterface.title_entries)
    instructions = graphene.String(lang=graphene.String(), description=docs.VoteSpecificationInterface.instructions)
    instructions_entries = graphene.List(LangStringEntry, description=docs.VoteSpecificationInterface.instructions_entries)
    is_custom = graphene.Boolean(required=True, description=docs.VoteSpecificationInterface.is_custom)
    vote_session_id = graphene.ID(required=True, description=docs.VoteSpecificationInterface.vote_session_id)
    vote_spec_template_id = graphene.ID(description=docs.VoteSpecificationInterface.vote_spec_template_id)
    vote_type = graphene.String(description=docs.VoteSpecificationInterface.vote_type)
    my_votes = graphene.List('assembl.graphql.votes.VoteUnion', required=True, description=docs.VoteSpecificationInterface.my_votes)
    num_votes = graphene.Int(required=True, description=docs.VoteSpecificationInterface.num_votes)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_instructions(self, args, context, info):
        return resolve_langstring(self.instructions, args.get('lang'))

    def resolve_instructions_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'instructions')

    def resolve_is_custom(self, args, context, info):
        return False if self.is_custom is None else self.is_custom

    def resolve_vote_session_id(self, args, context, info):
        return Node.to_global_id('VoteSession', self.widget_id)

    def resolve_vote_spec_template_id(self, args, context, info):
        if self.vote_spec_template_id:
            return Node.to_global_id(self.__class__.__name__, self.vote_spec_template_id)

    def resolve_vote_type(self, args, context, info):
        return self.type

    def resolve_my_votes(self, args, context, info):
        user_id = context.authenticated_userid
        return self.db.query(models.AbstractIdeaVote).filter_by(
            vote_spec_id=self.id, tombstone_date=None, voter_id=user_id, idea_id=self.criterion_idea_id).all()

    def resolve_num_votes(self, args, context, info):
        res = self.db.query(
            getattr(self.get_vote_class(), "voter_id")).filter_by(
            vote_spec_id=self.id,
            tombstone_date=None).count()
        # There is no distinct on purpose here.
        # For a token vote spec, voting on two categories is counted as 2 votes.
        return res


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


class VotesByCategory(graphene.ObjectType):
    token_category_id = graphene.ID(required=True)
    num_token = graphene.Int(required=True)


class TokenVoteSpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.TokenVoteSpecification
        interfaces = (Node, VoteSpecificationInterface)
        only_fields = ('id', 'exclusive_categories')

    token_categories = graphene.List(TokenCategorySpecification, required=True)
    token_votes = graphene.List(VotesByCategory, required=True)

    def resolve_token_votes(self, args, context, info):
        votes = []
        for token_category in self.get_token_categories():
            query = self.db.query(
                func.sum(getattr(self.get_vote_class(), "vote_value"))).filter_by(
                vote_spec_id=self.id,
                tombstone_date=None,
                token_category_id=token_category.id)
            # when there is no votes, query.first() equals (None,)
            # in this case set num_token to 0
            num_token = query.first()[0] or 0
            votes.append(
                VotesByCategory(
                    token_category_id=token_category.graphene_id(),
                    num_token=num_token
                )
            )

        return votes

    def resolve_token_categories(self, args, context, info):
        return self.get_token_categories()


class GaugeChoiceSpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.GaugeChoiceSpecification
        interfaces = (Node,)
        only_fields = ('id', 'value')

    label = graphene.String(lang=graphene.String())
    label_entries = graphene.List(LangStringEntry)

    def resolve_label(self, args, context, info):
        return resolve_langstring(self.label, args.get('lang'))

    def resolve_label_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'label')


def get_avg_choice(vote_spec):
    vote_cls = vote_spec.get_vote_class()
    voting_avg = vote_spec.db.query(func.avg(getattr(vote_cls, 'vote_value'))).filter_by(
        vote_spec_id=vote_spec.id,
        tombstone_date=None,
        idea_id=vote_spec.criterion_idea_id).first()
    # when there is no votes, query.first() equals (None,)
    avg = voting_avg[0] or 0
    return vote_spec.get_closest_choice(avg)


class GaugeVoteSpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.GaugeVoteSpecification
        interfaces = (Node, VoteSpecificationInterface)
        only_fields = ('id', )

    choices = graphene.List(GaugeChoiceSpecification)
    average_label = graphene.String(lang=graphene.String())
    average_result = graphene.Float(required=True)

    def resolve_average_label(self, args, context, info):
        avg_choice = get_avg_choice(self)
        if avg_choice is None:
            return None

        return resolve_langstring(avg_choice.label, args.get('lang'))

    def resolve_average_result(self, args, context, info):
        avg_choice = get_avg_choice(self)
        if avg_choice is None:
            return 0

        return avg_choice.value

    def resolve_choices(self, args, context, info):
        return self.get_choices()


class NumberGaugeVoteSpecification(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.NumberGaugeVoteSpecification
        interfaces = (Node, VoteSpecificationInterface)
        only_fields = ('id', 'minimum', 'maximum', 'nb_ticks', 'unit')

    average_result = graphene.Float(required=True)

    def resolve_average_result(self, args, context, info):
        vote_cls = self.get_vote_class()
        voting_avg = self.db.query(func.avg(getattr(vote_cls, 'vote_value'))).filter_by(
            vote_spec_id=self.id,
            tombstone_date=None,
            idea_id=self.criterion_idea_id).first()
        # when there is no votes, query.first() equals (None,)
        avg = voting_avg[0] or 0
        return avg


class VoteSpecificationUnion(SQLAlchemyUnion):
    class Meta:
        types = (TokenVoteSpecification, GaugeVoteSpecification, NumberGaugeVoteSpecification)
        model = models.AbstractVoteSpecification

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.TokenVoteSpecification):
            return TokenVoteSpecification
        elif isinstance(instance, models.GaugeVoteSpecification):
            return GaugeVoteSpecification
        elif isinstance(instance, models.NumberGaugeVoteSpecification):
            return NumberGaugeVoteSpecification


class TokenCategorySpecificationInput(graphene.InputObjectType):
    id = graphene.ID()
    title_entries = graphene.List(LangStringEntryInput, required=True)
    total_number = graphene.Int(required=True)
    typename = graphene.String()
    color = graphene.String(required=True)


class GaugeChoiceSpecificationInput(graphene.InputObjectType):
    id = graphene.ID()
    label_entries = graphene.List(LangStringEntryInput, required=True)
    value = graphene.Float(required=True)


class CreateTokenVoteSpecification(graphene.Mutation):

    class Input:
        vote_session_id = graphene.ID(required=True)
        proposal_id = graphene.ID()
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        exclusive_categories = graphene.Boolean(required=True)
        token_categories = graphene.List(TokenCategorySpecificationInput, required=True)
        vote_spec_template_id = graphene.ID()

    vote_specification = graphene.Field(lambda: TokenVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TokenVoteSpecification
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        vote_session_id = args.get('vote_session_id')
        vote_session_id = int(Node.from_global_id(vote_session_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        exclusive_categories = args.get('exclusive_categories')
        token_categories = args.get('token_categories')
        is_custom = args.get('is_custom')

        with cls.default_db.no_autoflush as db:
            vote_session = db.query(models.VoteSession).get(vote_session_id)
            title_ls = langstring_from_input_entries(title_entries)
            instructions_ls = langstring_from_input_entries(instructions_entries)
            vote_spec = cls(
                title=title_ls,
                instructions=instructions_ls,
                exclusive_categories=exclusive_categories,
                is_custom=is_custom
            )
            proposal_id = args.get('proposal_id')
            if proposal_id:
                proposal_id = int(Node.from_global_id(proposal_id)[1])
                proposal = models.Idea.get(proposal_id)
                vote_spec.criterion_idea = proposal

            vote_spec_template_id = args.get('vote_spec_template_id')
            if vote_spec_template_id:
                vote_spec_template_id = int(Node.from_global_id(vote_spec_template_id)[1])
                vote_spec.vote_spec_template_id = vote_spec_template_id

            if token_categories and (not vote_spec.criterion_idea_id or vote_spec.is_custom):
                for idx, token_category in enumerate(token_categories):
                    title_ls = langstring_from_input_entries(
                        token_category.get('title_entries', None))
                    total_number = token_category.get('total_number')
                    typename = token_category.get('typename', 'category{}'.format(idx + 1))
                    color = token_category.get('color')

                    vote_spec.token_categories.append(
                        models.TokenCategorySpecification(
                            total_number=total_number,
                            typename=typename, name=title_ls,
                            color=color)
                    )

            db.add(vote_spec)
            vote_session.vote_specifications.append(vote_spec)
            db.flush()

        return CreateTokenVoteSpecification(vote_specification=vote_spec)


class UpdateTokenVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        exclusive_categories = graphene.Boolean(required=True)
        token_categories = graphene.List(TokenCategorySpecificationInput, required=True)

    vote_specification = graphene.Field(lambda: TokenVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TokenVoteSpecification
        vote_spec_id = args.get('id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        exclusive_categories = args.get('exclusive_categories')
        token_categories = args.get('token_categories')

        with cls.default_db.no_autoflush as db:
            vote_spec = cls.get(vote_spec_id)
            require_instance_permission(CrudPermissions.UPDATE, vote_spec, context)
            update_langstring_from_input_entries(
                vote_spec, 'title', title_entries)
            update_langstring_from_input_entries(
                vote_spec, 'instructions', instructions_entries)
            vote_spec.is_custom = args.get('is_custom')
            vote_spec.exclusive_categories = exclusive_categories
            existing_token_categories = {
                token_category.id: token_category for token_category in vote_spec.token_categories}

            updated_token_categories = set()
            if token_categories and (not vote_spec.criterion_idea_id or vote_spec.is_custom):
                for idx, token_category_input in enumerate(token_categories):
                    if not token_category_input.get('id', '-1').startswith('-'):
                        id_ = int(Node.from_global_id(token_category_input['id'])[1])
                        updated_token_categories.add(id_)
                        token_category = models.TokenCategorySpecification.get(id_)
                        update_langstring_from_input_entries(
                            token_category, 'name', token_category_input['title_entries'])
                        token_category.total_number = token_category_input.get('total_number')
                        token_category.color = token_category_input.get('color')
                    else:
                        title_ls = langstring_from_input_entries(
                            token_category_input.get('title_entries', None))
                        total_number = token_category_input.get('total_number')
                        typename = token_category_input.get('typename', 'category{}'.format(idx + 1))
                        color = token_category_input.get('color')
                        vote_spec.token_categories.append(
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

        return UpdateTokenVoteSpecification(vote_specification=vote_spec)


class DeleteVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.votes.AbstractVoteSpecification
        vote_spec_id = args.get('id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        vote_spec = cls.get(vote_spec_id)
        if vote_spec:
            require_instance_permission(CrudPermissions.DELETE, vote_spec, context)

            # delete all vote specifications that have this spec as template
            with cls.default_db.no_autoflush as db:
                db.query(models.votes.AbstractVoteSpecification).filter(
                    models.votes.AbstractVoteSpecification.vote_spec_template_id == vote_spec.id
                ).delete()
                db.flush()
                db.delete(vote_spec)
                db.flush()

        return DeleteVoteSpecification(success=True)


class CreateGaugeVoteSpecification(graphene.Mutation):

    class Input:
        vote_session_id = graphene.ID(required=True)
        proposal_id = graphene.ID()
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        choices = graphene.List(GaugeChoiceSpecificationInput, required=True)
        vote_spec_template_id = graphene.ID()

    vote_specification = graphene.Field(lambda: GaugeVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.GaugeVoteSpecification
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        vote_session_id = args.get('vote_session_id')
        vote_session_id = int(Node.from_global_id(vote_session_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        choices = args.get('choices')

        with cls.default_db.no_autoflush as db:
            vote_session = db.query(models.VoteSession).get(vote_session_id)
            title_ls = langstring_from_input_entries(title_entries)
            instructions_ls = langstring_from_input_entries(instructions_entries)
            vote_spec = cls(
                title=title_ls,
                instructions=instructions_ls,
                is_custom=args.get('is_custom')
            )
            proposal_id = args.get('proposal_id')
            if proposal_id:
                proposal_id = int(Node.from_global_id(proposal_id)[1])
                proposal = models.Idea.get(proposal_id)
                vote_spec.criterion_idea = proposal

            vote_spec_template_id = args.get('vote_spec_template_id')
            if vote_spec_template_id:
                vote_spec_template_id = int(Node.from_global_id(vote_spec_template_id)[1])
                vote_spec.vote_spec_template_id = vote_spec_template_id

            for idx, choice in enumerate(choices):
                label_ls = langstring_from_input_entries(
                    choice['label_entries'])
                value = choice['value']
                vote_spec.choices.append(
                    models.GaugeChoiceSpecification(
                        label=label_ls, value=value)
                )

            db.add(vote_spec)
            vote_session.vote_specifications.append(vote_spec)
            db.flush()

        return CreateGaugeVoteSpecification(vote_specification=vote_spec)


class UpdateGaugeVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        choices = graphene.List(GaugeChoiceSpecificationInput, required=True)

    vote_specification = graphene.Field(lambda: GaugeVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.GaugeVoteSpecification
        vote_spec_id = args.get('id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')
        choices = args.get('choices')

        with cls.default_db.no_autoflush as db:
            vote_spec = cls.get(vote_spec_id)
            require_instance_permission(CrudPermissions.UPDATE, vote_spec, context)
            update_langstring_from_input_entries(
                vote_spec, 'title', title_entries)
            update_langstring_from_input_entries(
                vote_spec, 'instructions', instructions_entries)
            vote_spec.is_custom = args.get('is_custom')
            existing_choices = {
                choice.id: choice for choice in vote_spec.choices}
            updated_choices = set()
            for idx, choice_input in enumerate(choices):
                if not choice_input.get('id', '-1').startswith('-'):
                    # update the choice
                    id_ = int(Node.from_global_id(choice_input['id'])[1])
                    updated_choices.add(id_)
                    choice = models.GaugeChoiceSpecification.get(id_)
                    update_langstring_from_input_entries(
                        choice, 'label', choice_input['label_entries'])
                    choice.value = choice_input['value']
                else:
                    # create a choice
                    label_ls = langstring_from_input_entries(
                        choice_input.get('label_entries', None))
                    value = choice_input.get('value')
                    vote_spec.choices.append(
                        models.GaugeChoiceSpecification(
                            label=label_ls, value=value)
                    )

            # remove choices that are not in choices input
            for choice_id in set(existing_choices.keys()
                                   ).difference(updated_choices):
                db.delete(existing_choices[choice_id])

            db.flush()

        return UpdateGaugeVoteSpecification(vote_specification=vote_spec)


class CreateNumberGaugeVoteSpecification(graphene.Mutation):

    class Input:
        vote_session_id = graphene.ID(required=True)
        proposal_id = graphene.ID()
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        minimum = graphene.Float(required=True)
        maximum = graphene.Float(required=True)
        nb_ticks = graphene.Int(required=True)
        unit = graphene.String(required=True)
        vote_spec_template_id = graphene.ID()

    vote_specification = graphene.Field(lambda: NumberGaugeVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.NumberGaugeVoteSpecification
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        vote_session_id = args.get('vote_session_id')
        vote_session_id = int(Node.from_global_id(vote_session_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')

        with cls.default_db.no_autoflush as db:
            vote_session = db.query(models.VoteSession).get(vote_session_id)
            title_ls = langstring_from_input_entries(title_entries)
            instructions_ls = langstring_from_input_entries(instructions_entries)
            vote_spec = cls(
                title=title_ls,
                instructions=instructions_ls,
                minimum=args['minimum'],
                maximum=args['maximum'],
                nb_ticks=args['nb_ticks'],
                unit=args['unit'],
                is_custom=args.get('is_custom')
            )
            proposal_id = args.get('proposal_id')
            if proposal_id:
                proposal_id = int(Node.from_global_id(proposal_id)[1])
                proposal = models.Idea.get(proposal_id)
                vote_spec.criterion_idea = proposal

            vote_spec_template_id = args.get('vote_spec_template_id')
            if vote_spec_template_id:
                vote_spec_template_id = int(Node.from_global_id(vote_spec_template_id)[1])
                vote_spec.vote_spec_template_id = vote_spec_template_id

            db.add(vote_spec)
            vote_session.vote_specifications.append(vote_spec)
            db.flush()

        return CreateNumberGaugeVoteSpecification(vote_specification=vote_spec)


class UpdateNumberGaugeVoteSpecification(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        instructions_entries = graphene.List(LangStringEntryInput, required=True)
        is_custom = graphene.Boolean()
        minimum = graphene.Float(required=True)
        maximum = graphene.Float(required=True)
        nb_ticks = graphene.Int(required=True)
        unit = graphene.String(required=True)

    vote_specification = graphene.Field(lambda: NumberGaugeVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.NumberGaugeVoteSpecification
        vote_spec_id = args.get('id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        title_entries = args.get('title_entries')
        instructions_entries = args.get('instructions_entries')

        with cls.default_db.no_autoflush as db:
            vote_spec = cls.get(vote_spec_id)
            require_instance_permission(CrudPermissions.UPDATE, vote_spec, context)
            update_langstring_from_input_entries(
                vote_spec, 'title', title_entries)
            update_langstring_from_input_entries(
                vote_spec, 'instructions', instructions_entries)
            vote_spec.is_custom = args.get('is_custom')
            vote_spec.minimum = args['minimum']
            vote_spec.maximum = args['maximum']
            vote_spec.nb_ticks = args['nb_ticks']
            vote_spec.unit = args['unit']
            db.flush()

        return UpdateNumberGaugeVoteSpecification(vote_specification=vote_spec)


class CreateProposal(graphene.Mutation):

    class Input:
        vote_session_id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput, required=True)
        order = graphene.Float()

    proposal = graphene.Field(lambda: Idea)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Idea
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        vote_session_id = args.get('vote_session_id')
        vote_session_id = int(Node.from_global_id(vote_session_id)[1])
        title_entries = args.get('title_entries')
        description_entries = args.get('description_entries')
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        with cls.default_db.no_autoflush as db:
            title_ls = langstring_from_input_entries(title_entries)
            description_ls = langstring_from_input_entries(description_entries)
            proposal = cls(
                discussion_id=discussion_id,
                title=title_ls,
                description=description_ls
            )
            db.add(proposal)
            identifier = 'voteSession{}'.format(vote_session_id)
            root_thematic = get_root_thematic_for_phase(discussion, identifier)
            if root_thematic is None:
                raise Exception(
                    "There is no root thematic for this vote session.")

            order = len(root_thematic.get_children()) + 1.0
            db.add(
                models.IdeaLink(source=root_thematic, target=proposal,
                                order=args.get('order', order)))
            db.flush()

        return CreateProposal(proposal=proposal)


class UpdateProposal(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput, required=True)
        order = graphene.Float()

    proposal = graphene.Field(lambda: Idea)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Idea
        proposal_id = args.get('id')
        proposal_id = int(Node.from_global_id(proposal_id)[1])
        title_entries = args.get('title_entries')
        description_entries = args.get('description_entries')

        with cls.default_db.no_autoflush as db:
            proposal = cls.get(proposal_id)
            require_instance_permission(CrudPermissions.UPDATE, proposal, context)
            update_langstring_from_input_entries(
                proposal, 'title', title_entries)
            update_langstring_from_input_entries(
                proposal, 'description', description_entries)

            # change order if needed
            order = args.get('order')
            if order:
                proposal.source_links[0].order = order

            db.flush()

        return UpdateProposal(proposal=proposal)


class DeleteProposal(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        proposal_id = args.get('id')
        proposal_id = int(Node.from_global_id(proposal_id)[1])
        proposal = models.Idea.get(proposal_id)
        require_instance_permission(CrudPermissions.DELETE, proposal, context)
        proposal.is_tombstone = True
        proposal.db.flush()
        return DeleteProposal(success=True)
