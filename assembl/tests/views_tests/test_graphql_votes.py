from graphql_relay.node.node import to_global_id

from assembl.graphql.schema import Schema as schema


def test_graphql_add_token_vote(graphql_participant1_request, vote_session, vote_proposal, token_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    token_category_id = to_global_id("TokenCategorySpecification", token_vote_specification_associated_to_proposal.token_categories[0].id)
    vote_spec_id = to_global_id("TokenVoteSpecification", token_vote_specification_associated_to_proposal.id)
    res = schema.execute(
        graphql_registry['addTokenVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 3
        }
    )
    assert res.errors is None
    assert len(res.data['addTokenVote']['voteSpecification']['myVotes']) == 1
    assert res.data['addTokenVote']['voteSpecification']['myVotes'][0]['voteValue'] == 3
    assert res.data['addTokenVote']['voteSpecification']['myVotes'][0]['proposalId'] == proposal_id
    assert res.data['addTokenVote']['voteSpecification']['myVotes'][0]['tokenCategoryId'] == token_category_id


def test_graphql_delete_token_vote(graphql_participant1_request, vote_session, vote_proposal, token_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    token_category_id = to_global_id("TokenCategorySpecification", token_vote_specification_associated_to_proposal.token_categories[0].id)
    vote_spec_id = to_global_id("TokenVoteSpecification", token_vote_specification_associated_to_proposal.id)
    # add token vote
    res = schema.execute(
        graphql_registry['addTokenVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 3
        }
    )
    assert res.errors is None
    # and remove it
    res = schema.execute(
        graphql_registry['deleteTokenVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category_id,
            "voteSpecId": vote_spec_id
        }
    )
    assert res.errors is None
    assert len(res.data['deleteTokenVote']['voteSpecification']['myVotes']) == 0
