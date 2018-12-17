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
        graphql_registry['addTokenVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 0
        }
    )
    assert res.errors is None
    assert len(res.data['addTokenVote']['voteSpecification']['myVotes']) == 0


def test_graphql_add_gauge_vote(graphql_participant1_request, vote_session, vote_proposal, gauge_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    vote_spec_id = to_global_id("GaugeVoteSpecification", gauge_vote_specification_associated_to_proposal.id)
    res = schema.execute(
        graphql_registry['addGaugeVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 20.0
        }
    )
    assert res.errors is None
    assert len(res.data['addGaugeVote']['voteSpecification']['myVotes']) == 1
    assert res.data['addGaugeVote']['voteSpecification']['myVotes'][0]['selectedValue'] == 20.0
    assert res.data['addGaugeVote']['voteSpecification']['myVotes'][0]['proposalId'] == proposal_id


def test_graphql_delete_gauge_vote(graphql_participant1_request, vote_session, vote_proposal, gauge_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    vote_spec_id = to_global_id("GaugeVoteSpecification", gauge_vote_specification_associated_to_proposal.id)
    # add gauge vote
    res = schema.execute(
        graphql_registry['addGaugeVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 20.0
        }
    )
    assert res.errors is None
    # and remove it
    res = schema.execute(
        graphql_registry['addGaugeVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "voteSpecId": vote_spec_id,
            "voteValue": None
        }
    )
    assert res.errors is None
    assert len(res.data['addGaugeVote']['voteSpecification']['myVotes']) == 0


def test_graphql_vote_results(graphql_participant1_request, vote_session, vote_proposal, token_vote_spec_with_votes, gauge_vote_specification_with_votes, graphql_registry):
    res = schema.execute(
        graphql_registry['VoteSession'],
        context_value=graphql_participant1_request,
        variable_values={
            "ideaId": vote_session.idea_id,
            "lang": "en"
        }
    )
    assert res.errors is None
    assert res.data['voteSession']['proposals'][0]['voteResults']['numParticipants'] == 2
    names = {participant['displayName'] for participant in res.data['voteSession']['proposals'][0]['voteResults']['participants']}
    assert names == set([u'A. Barking Loon', u'mr_admin_user'])
    # on token vote spec:
    assert res.data['voteSession']['proposals'][0]['modules'][0]['numVotes'] == 3
    first_category = res.data['voteSession']['proposals'][0]['modules'][0]['tokenCategories'][0]['id']
    second_category = res.data['voteSession']['proposals'][0]['modules'][0]['tokenCategories'][1]['id']
    token_votes = {entry['tokenCategoryId']: entry['numToken'] for entry in res.data['voteSession']['proposals'][0]['modules'][0]['tokenVotes']}
    assert token_votes[first_category] == 3
    assert token_votes[second_category] == 3
    # on gauge vote spec:
    assert res.data['voteSession']['proposals'][0]['modules'][1]['numVotes'] == 1
    assert res.data['voteSession']['proposals'][0]['modules'][1]['averageLabel'] == u'Tick 2'
    assert res.data['voteSession']['proposals'][0]['modules'][1]['averageResult'] == 20.0


def test_graphql_vote_results_number_gauge_average(graphql_participant1_request, vote_session, vote_proposal, number_gauge_vote_specification_with_votes, graphql_registry):
    res = schema.execute(
        graphql_registry['VoteSession'],
        context_value=graphql_participant1_request,
        variable_values={
            "ideaId": vote_session.idea_id,
            "lang": "en"
        }
    )
    assert res.errors is None
    assert res.data['voteSession']['proposals'][0]['modules'][0]['averageResult'] == 40.0


def test_graphql_vote_results_gauges_zero_votes(graphql_participant1_request, vote_session, vote_proposal, gauge_vote_specification_associated_to_proposal, number_gauge_vote_specification_associated_to_proposal, graphql_registry):
    res = schema.execute(
        graphql_registry['VoteSession'],
        context_value=graphql_participant1_request,
        variable_values={
            "ideaId": vote_session.idea_id,
            "lang": "en"
        }
    )
    assert res.errors is None
    assert res.data['voteSession']['proposals'][0]['voteResults']['numParticipants'] == 0
    assert res.data['voteSession']['proposals'][0]['modules'][0]['averageLabel'] is None
    assert res.data['voteSession']['proposals'][0]['modules'][0]['averageResult'] is None
    assert res.data['voteSession']['proposals'][0]['modules'][0]['averageResult'] is None
