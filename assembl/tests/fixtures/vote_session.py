# -*- coding: utf-8 -*-
import pytest

from graphql_relay.node.node import to_global_id


@pytest.fixture(scope="function")
def vote_session(request, test_session, discussion, timeline_vote_session,
                 simple_file, admin_user):
    from assembl.graphql.utils import create_root_thematic
    from assembl.models import VoteSession, VoteSessionAttachment, LangString
    vote_session = VoteSession(
        discussion=discussion,
        discussion_phase=timeline_vote_session,
        title=LangString.create(u"vote session fixture", "en"),
        sub_title=LangString.create(u"vote session sub title fixture", "en"),
        instructions_section_title=LangString.create(u"vote session instructions title fixture", "en"),
        instructions_section_content=LangString.create(u"vote session instructions fixture. Lorem ipsum dolor sit amet", "en"),
        propositions_section_title=LangString.create(u"vote session propositions section title fixture", "en")
    )
    attachment = VoteSessionAttachment(
        discussion=discussion,
        document=simple_file,
        vote_session=vote_session,
        title=u"vote session image fixture",
        creator=admin_user,
        attachmentPurpose='IMAGE'
    )

    test_session.add(vote_session)
    test_session.add(attachment)
    test_session.flush()

    root_thematic = create_root_thematic(vote_session.discussion_phase)
    test_session.flush()

    def fin():
        print "finalizer vote_session"
        # header_image may have been replaced by another one in a test
        # so be sure to remove attachments, not header_image
        with test_session.no_autoflush as db:
            for attachment in list(vote_session.attachments):
                if attachment.document != simple_file:
                    attachment.document.delete()
                attachment.delete()

            db.delete(root_thematic)
            db.delete(vote_session)
            db.flush()

    request.addfinalizer(fin)
    return vote_session


@pytest.fixture(scope="function")
def token_vote_specification(request, test_session, graphql_request, vote_session, graphql_registry):
    mutation = graphql_registry['createTokenVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": False,
        "exclusiveCategories": True,
        "tokenCategories": [
            {"titleEntries": [
                {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
                {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
             ],
             "typename": "positive",
             "totalNumber": 10,
             "color": 'red'
            }
        ]
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer token_vote_specification"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def gauge_vote_specification(request, test_session, graphql_request, vote_session, graphql_registry):
    mutation = graphql_registry['createGaugeVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": False,
        "choices": [
            {"labelEntries": [
                {"value": u"Cran 1", "localeCode": "fr"},
                {"value": u"Tick 1", "localeCode": "en"}
             ],
             "value": 10.0,
            },
            {"labelEntries": [
                {"value": u"Cran 2", "localeCode": "fr"},
                {"value": u"Tick 2", "localeCode": "en"}
             ],
             "value": 20.0,
            }
        ]
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer gauge_vote_specification"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def number_gauge_vote_specification(request, test_session, graphql_request, vote_session, graphql_registry):
    mutation = graphql_registry['createNumberGaugeVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": False,
        "minimum": 0.0,
        "maximum": 60.0,
        "nbTicks": 7,
        "unit": u"M€"
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer number_gauge_vote_specification"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def vote_proposal(request, test_session, discussion, graphql_request, vote_session, graphql_registry):
    mutation = graphql_registry['createProposal']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "descriptionEntries": [
            {"value": u"Description: Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Description: Understanding the dynamics and issues", "localeCode": "en"}
        ]
    })
    assert res.errors is None
    from assembl.graphql.utils import get_root_thematic_for_phase
    root_thematic = get_root_thematic_for_phase(vote_session.discussion_phase)
    proposal = root_thematic.children[0]

    def fin():
        print "finalizer vote_proposal"
        test_session.delete(proposal)
        test_session.delete(root_thematic)
        test_session.flush()

    request.addfinalizer(fin)
    return proposal


@pytest.fixture(scope="function")
def token_vote_specification_associated_to_proposal(request, test_session, discussion, graphql_request, vote_session, token_vote_specification, vote_proposal, graphql_registry):
    mutation = graphql_registry['createTokenVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    proposal_id = to_global_id("Idea", vote_proposal.id)
    # token vote spec similar to token_vote_specification fixture, but with exclusiveCategories set to False
    template_token_vote_spec_id = to_global_id("TokenVoteSpecification", token_vote_specification.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "proposalId": proposal_id,
        "voteSpecTemplateId": template_token_vote_spec_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Instructions : Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Instructions: Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": True,
        "exclusiveCategories": False,
        "tokenCategories": [
            {"titleEntries": [
                {"value": u"Pour", "localeCode": "fr"},
                {"value": u"In favor", "localeCode": "en"}
             ],
             "typename": "positive",
             "totalNumber": 9,
             "color": 'green'
            },
            {"titleEntries": [
                {"value": u"Contre", "localeCode": "fr"},
                {"value": u"Against", "localeCode": "en"}
             ],
             "typename": "negative",
             "totalNumber": 9,
             "color": 'red'
            }
        ]
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer token_vote_specification_associated_to_proposal"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def gauge_vote_specification_associated_to_proposal(request, test_session, discussion, graphql_request, vote_session, gauge_vote_specification, vote_proposal, graphql_registry):
    mutation = graphql_registry['createGaugeVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    proposal_id = to_global_id("Idea", vote_proposal.id)
    template_gauge_vote_spec_id = to_global_id("GaugeVoteSpecification", gauge_vote_specification.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "proposalId": proposal_id,
        "voteSpecTemplateId": template_gauge_vote_spec_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Instructions : Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Instructions: Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": True,
        "choices": [
            {"labelEntries": [
                {"value": u"Cran 1", "localeCode": "fr"},
                {"value": u"Tick 1", "localeCode": "en"}
             ],
             "value": 10.0,
            },
            {"labelEntries": [
                {"value": u"Cran 2", "localeCode": "fr"},
                {"value": u"Tick 2", "localeCode": "en"}
             ],
             "value": 20.0,
            }
        ]
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer gauge_vote_specification_associated_to_proposal"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def number_gauge_vote_specification_associated_to_proposal(request, test_session, discussion, graphql_request, vote_session, number_gauge_vote_specification, vote_proposal, graphql_registry):
    mutation = graphql_registry['createNumberGaugeVoteSpecification']
    vote_session_id = to_global_id("VoteSession", vote_session.id)
    proposal_id = to_global_id("Idea", vote_proposal.id)
    template_gauge_vote_spec_id = to_global_id("NumberGaugeVoteSpecification", number_gauge_vote_specification.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "voteSessionId": vote_session_id,
        "proposalId": proposal_id,
        "voteSpecTemplateId": template_gauge_vote_spec_id,
        "titleEntries": [
            {"value": u"Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "instructionsEntries":
        [
            {"value": u"Instructions : Comprendre les dynamiques et les enjeux", "localeCode": "fr"},
            {"value": u"Instructions: Understanding the dynamics and issues", "localeCode": "en"}
        ],
        "isCustom": True,
        "minimum": 0.0,
        "maximum": 60.0,
        "nbTicks": 7,
        "unit": u"M€"
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[-1]

    def fin():
        print "finalizer number_gauge_vote_specification_associated_to_proposal"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec


@pytest.fixture(scope="function")
def token_vote_spec_with_votes(graphql_request, graphql_participant1_request, vote_session, vote_proposal, token_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    token_category_id = to_global_id("TokenCategorySpecification", token_vote_specification_associated_to_proposal.token_categories[0].id)
    token_category2_id = to_global_id("TokenCategorySpecification", token_vote_specification_associated_to_proposal.token_categories[1].id)
    vote_spec_id = to_global_id("TokenVoteSpecification", token_vote_specification_associated_to_proposal.id)
    from assembl.graphql.schema import Schema as schema
    # participant1 votes on both categories
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
    res = schema.execute(
        graphql_registry['addTokenVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category2_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 2
        }
    )
    assert res.errors is None
    # admin user vote on one category
    res = schema.execute(
        graphql_registry['addTokenVote'],
        context_value=graphql_request,
        variable_values={
            "proposalId": proposal_id,
            "tokenCategoryId": token_category2_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 1
        }
    )
    assert res.errors is None
    return token_vote_specification_associated_to_proposal


@pytest.fixture(scope="function")
def gauge_vote_specification_with_votes(graphql_participant1_request, vote_session, vote_proposal, gauge_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    vote_spec_id = to_global_id("GaugeVoteSpecification", gauge_vote_specification_associated_to_proposal.id)
    from assembl.graphql.schema import Schema as schema
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
    return gauge_vote_specification_associated_to_proposal


@pytest.fixture(scope="function")
def number_gauge_vote_specification_with_votes(graphql_participant1_request, vote_session, vote_proposal, number_gauge_vote_specification_associated_to_proposal, graphql_registry):
    proposal_id = to_global_id("Idea", vote_proposal.id)
    vote_spec_id = to_global_id("NumberGaugeVoteSpecification", number_gauge_vote_specification_associated_to_proposal.id)
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(
        graphql_registry['addGaugeVote'],
        context_value=graphql_participant1_request,
        variable_values={
            "proposalId": proposal_id,
            "voteSpecId": vote_spec_id,
            "voteValue": 40.0
        }
    )
    assert res.errors is None
    return number_gauge_vote_specification_associated_to_proposal
