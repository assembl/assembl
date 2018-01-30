# -*- coding: utf-8 -*-
import pytest

from graphql_relay.node.node import to_global_id


@pytest.fixture(scope="function")
def vote_session(request, test_session, discussion, timeline_vote_session,
                 simple_file, admin_user):
    from assembl.models import VoteSession, VoteSessionAttachment, LangString
    vote_session = VoteSession(
        discussion_phase=timeline_vote_session,
        title=LangString.create(u"vote session fixture", "en"),
        sub_title=LangString.create(u"vote session sub title fixture", "en"),
        instructions_section_title=LangString.create(u"vote session instructions title fixture", "en"),
        instructions_section_content=LangString.create(u"vote session instructions fixture. Lorem ipsum dolor sit amet", "en"),
        propositions_section_title=LangString.create(u"vote session propositions section title fixture", "en")
    )
    VoteSessionAttachment(
        discussion=discussion,
        document=simple_file,
        vote_session=vote_session,
        title=u"vote session image fixture",
        creator=admin_user,
        attachmentPurpose='IMAGE'
    )

    test_session.add(vote_session)
    test_session.flush()

    def fin():
        print "finalizer vote_session"
        # header_image may have been replaced by another one in a test
        # so be sure to remove attachments, not header_image
        test_session.delete(vote_session.attachments[0].document)
        test_session.delete(vote_session.attachments[0])
        test_session.delete(vote_session)
        test_session.flush()

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
    vote_spec = vote_session.vote_specifications[0]

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
    vote_spec = vote_session.vote_specifications[0]

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
        "minimum": 0.0,
        "maximum": 60.0,
        "nbTicks": 7,
        "unit": u"M€"
    })
    assert res.errors is None
    vote_spec = vote_session.vote_specifications[0]

    def fin():
        print "finalizer number_gauge_vote_specification"
        test_session.delete(vote_spec)
        test_session.flush()

    request.addfinalizer(fin)
    return vote_spec
