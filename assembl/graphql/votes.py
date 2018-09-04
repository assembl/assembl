import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from .permissions_helpers import require_cls_permission
from .types import SecureObjectType, SQLAlchemyUnion
from .utils import DateTime, abort_transaction_on_exception
from .vote_session import TokenVoteSpecification, VoteSpecificationUnion
import assembl.graphql.docstrings as docs


class VoteInterface(graphene.Interface):
    __doc__ = docs.VoteInterface.__doc__

    vote_date = DateTime(required=True)
    voter_id = graphene.ID(required=True)
    vote_spec_id = graphene.ID(required=True)
    proposal_id = graphene.ID(required=True)

    def resolve_voter_id(self, args, context, info):
        return models.AgentProfile.graphene_id_for(self.voter_id)

    def resolve_vote_spec_id(self, args, context, info):
        return self.vote_spec.graphene_id()

    def resolve_proposal_id(self, args, context, info):
        return models.Idea.graphene_id_for(self.idea_id)


class TokenVote(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.TokenVote.__doc__

    class Meta:
        model = models.TokenIdeaVote
        interfaces = (Node, VoteInterface)
        only_fields = ('id', 'vote_value')

    token_category_id = graphene.ID(required=True)

    def resolve_token_category_id(self, args, context, info):
        return self.token_category.graphene_id()


class GaugeVote(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.GaugeVote.__doc__

    class Meta:
        model = models.GaugeIdeaVote
        interfaces = (Node, VoteInterface)
        only_fields = ('id', 'vote_value')


class VoteUnion(SQLAlchemyUnion):

    class Meta:
        types = (TokenVote, GaugeVote)
        model = models.AbstractIdeaVote

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.TokenIdeaVote):
            return TokenVote
        elif isinstance(instance, models.GaugeIdeaVote):
            return GaugeVote


class AddTokenVote(graphene.Mutation):
    __doc__ = docs.AddTokenVote.__doc__

    class Input:
        proposal_id = graphene.ID(required=True)
        token_category_id = graphene.ID(required=True)
        vote_spec_id = graphene.ID(required=True)
        vote_value = graphene.Int(required=True)

    vote_specification = graphene.Field(lambda: TokenVoteSpecification)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        require_cls_permission(CrudPermissions.CREATE, models.TokenIdeaVote, context)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid

        vote_value = args.get('vote_value')
        proposal_id = args.get('proposal_id')
        proposal_id = int(Node.from_global_id(proposal_id)[1])
        proposal = models.Idea.get(proposal_id)

        token_category_id = args.get('token_category_id')
        token_category_id = int(Node.from_global_id(token_category_id)[1])
        token_category = models.TokenCategorySpecification.get(token_category_id)

        vote_spec_id = args.get('vote_spec_id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        vote_spec = models.AbstractVoteSpecification.get(vote_spec_id)

        vote = models.TokenIdeaVote.query.filter_by(
            vote_spec_id=vote_spec.id, tombstone_date=None, voter_id=user_id,
            token_category_id=token_category_id).first()
        if vote_value == 0:
            if vote is not None:
                vote.is_tombstone = True
        else:
            if vote is None or vote.vote_value != vote_value:
                vote = models.TokenIdeaVote(
                    discussion=discussion,
                    vote_spec=vote_spec,
                    widget=vote_spec.widget,
                    voter_id=user_id,
                    idea=proposal,
                    vote_value=vote_value,
                    token_category=token_category)
                permissions = get_permissions(user_id, discussion_id)
                vote = vote.handle_duplication(
                    permissions=permissions, user_id=user_id)
                vote.db.add(vote)

        proposal.db.flush()
        return AddTokenVote(vote_specification=vote_spec)


class AddGaugeVote(graphene.Mutation):
    __doc__ = docs.AddGaugeVote.__doc__

    class Input:
        proposal_id = graphene.ID(required=True)
        vote_spec_id = graphene.ID(required=True)
        vote_value = graphene.Float(required=False)

    vote_specification = graphene.Field(lambda: VoteSpecificationUnion)  # need to match GaugeVoteSpecification / NumberGaugeVoteSpecification

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        require_cls_permission(CrudPermissions.CREATE, models.TokenIdeaVote, context)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid
        vote_value = args.get('vote_value')

        proposal_id = args.get('proposal_id')
        proposal_id = int(Node.from_global_id(proposal_id)[1])
        proposal = models.Idea.get(proposal_id)

        vote_spec_id = args.get('vote_spec_id')
        vote_spec_id = int(Node.from_global_id(vote_spec_id)[1])
        vote_spec = models.AbstractVoteSpecification.get(vote_spec_id)

        vote = models.GaugeIdeaVote.query.filter_by(
            vote_spec_id=vote_spec.id, tombstone_date=None, voter_id=user_id).first()
        if vote_value is None:
            if vote is not None:
                vote.is_tombstone = True
        else:
            if vote is None or vote.vote_value != vote_value:
                vote = models.GaugeIdeaVote(
                    discussion=discussion,
                    vote_spec=vote_spec,
                    widget=vote_spec.widget,
                    voter_id=user_id,
                    idea=proposal,
                    vote_value=vote_value)

                permissions = get_permissions(user_id, discussion_id)
                vote = vote.handle_duplication(
                    permissions=permissions, user_id=user_id)
                vote.db.add(vote)
        proposal.db.flush()
        return AddGaugeVote(vote_specification=vote_spec)
