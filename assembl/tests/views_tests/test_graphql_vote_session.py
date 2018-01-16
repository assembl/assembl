# -*- coding: utf-8 -*-

from assembl.graphql.schema import Schema as schema
from assembl.lib.utils import snake_to_camel
import os
from io import BytesIO


def assert_langstring_is_equal(langstring_name, fetched_model, source_model):
    source_value = getattr(source_model, langstring_name).entries[0].value
    fetched_value = fetched_model[snake_to_camel(langstring_name) + 'Entries'][0]['value']
    assert source_value == fetched_value


def assert_langstrings_are_equal(langstrings_names, fetched_model, source_model):
    for langstring_name in langstrings_names:
        assert_langstring_is_equal(langstring_name, fetched_model, source_model)


def en_value(entry):
    return entry[0]['value']


def en_entry(value):
    return [{"localeCode": "en", "value": value}]


def assert_graphql_unauthorized(response):
    assert "wrong credentials" in response.errors[0].message


def voteSessionQuery(graphql_registry):
    return (graphql_registry['fragments']['LangString'] +
            graphql_registry['fragments']['VoteSession'] +
            graphql_registry['VoteSession'])


def updateVoteSessionQuery(graphql_registry):
    return (graphql_registry['fragments']['LangString'] +
            graphql_registry['fragments']['VoteSession'] +
            graphql_registry['mutations']['updateVoteSession'])


def test_graphql_get_vote_session_unauthenticated(graphql_unauthenticated_request, vote_session, graphql_registry):
    response = schema.execute(
        voteSessionQuery(graphql_registry),
        context_value=graphql_unauthenticated_request,
        variable_values={
            "discussionPhaseId": vote_session.discussion_phase_id
        }
    )
    assert_graphql_unauthorized(response)


def test_graphql_get_vote_session(graphql_participant1_request, vote_session, graphql_registry):
    response = schema.execute(
        voteSessionQuery(graphql_registry),
        context_value=graphql_participant1_request,
        variable_values={
            "discussionPhaseId": vote_session.discussion_phase_id
        }
    )

    assert response.errors is None
    fetched_vote_session = response.data['voteSession']

    assert_langstrings_are_equal(
        [
            "title",
            "sub_title",
            "instructions_section_title",
            "instructions_section_content",
            "propositions_section_title"
        ],
        fetched_vote_session,
        vote_session)

    fetched_image = fetched_vote_session['headerImage']
    source_image = vote_session.attachments[0].document
    assert fetched_image['title'] == source_image.title
    assert fetched_image['mimeType'] == source_image.mime_type
    assert fetched_image['externalUrl'] == source_image.external_url


def mutate_and_assert(graphql_request, discussion_phase_id, test_app, graphql_registry):
    new_title = u"updated vote session title"
    new_sub_title = u"updated vote session sub title"
    new_instructions_section_title = u"updated vote session instructions title"
    new_instructions_section_content = u"updated vote session instructions content"
    new_propositions_section_title = u"updated vote session propositions section title"

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    new_image_name = u'new-image.png'
    new_image_mime_type = 'image/png'
    new_image = FieldStorage(new_image_name, new_image_mime_type)
    image_var_name = u'variables.img'
    graphql_request.POST[image_var_name] = new_image

    response = schema.execute(
        updateVoteSessionQuery(graphql_registry),
        context_value=graphql_request,
        variable_values={
            "discussionPhaseId": discussion_phase_id,
            "titleEntries": en_entry(new_title),
            "subTitleEntries": en_entry(new_sub_title),
            "instructionsSectionTitleEntries": en_entry(new_instructions_section_title),
            "instructionsSectionContentEntries": en_entry(new_instructions_section_content),
            "propositionsSectionTitleEntries": en_entry(new_propositions_section_title),
            "headerImage": image_var_name
        }
    )

    assert response.errors is None
    fetched_vote_session = response.data['updateVoteSession']['voteSession']

    assert en_value(fetched_vote_session['titleEntries']) == new_title
    assert en_value(fetched_vote_session['subTitleEntries']) == new_sub_title
    assert en_value(fetched_vote_session['instructionsSectionTitleEntries']) == new_instructions_section_title
    assert en_value(fetched_vote_session['instructionsSectionContentEntries']) == new_instructions_section_content
    assert en_value(fetched_vote_session['propositionsSectionTitleEntries']) == new_propositions_section_title

    fetched_image = fetched_vote_session['headerImage']
    assert fetched_image['title'] == new_image_name
    assert fetched_image['mimeType'] == new_image_mime_type
    new_image_data = new_image.file.getvalue()
    fetched_image_data = test_app.get(fetched_image['externalUrl']).body
    assert fetched_image_data == new_image_data


def test_graphql_update_vote_session(graphql_request, vote_session, test_app, graphql_registry):
    mutate_and_assert(graphql_request, vote_session.discussion_phase_id, test_app, graphql_registry)


def assert_vote_session_not_created(discussion_phase_id, graphql_request, graphql_registry):
    response = schema.execute(
        voteSessionQuery(graphql_registry),
        context_value=graphql_request,
        variable_values={"discussionPhaseId": discussion_phase_id}
    )
    assert (response.errors is None) and (response.data['voteSession'] is None)


def test_graphql_create_vote_session(graphql_request, timeline_vote_session, test_app, graphql_registry):
    assert_vote_session_not_created(timeline_vote_session.id, graphql_request, graphql_registry)
    mutate_and_assert(graphql_request, timeline_vote_session.id, test_app, graphql_registry)


def test_graphql_create_vote_session_unauthenticated(graphql_participant1_request, timeline_vote_session, test_app, graphql_registry):
    assert_vote_session_not_created(timeline_vote_session.id, graphql_participant1_request, graphql_registry)
    mutate_and_assert_unauthorized(graphql_participant1_request, timeline_vote_session.id, graphql_registry)


def mutate_and_assert_unauthorized(graphql_request, discussion_phase_id, graphql_registry):
    new_title = u"updated vote session title"
    response = schema.execute(
        updateVoteSessionQuery(graphql_registry),
        context_value=graphql_request,
        variable_values={
            "discussionPhaseId": discussion_phase_id,
            "titleEntries": [{"localeCode": "en", "value": new_title}]
        }
    )
    assert_graphql_unauthorized(response)


def test_graphql_update_vote_session_unauthenticated(graphql_unauthenticated_request, vote_session, graphql_registry):
    mutate_and_assert_unauthorized(graphql_unauthenticated_request, vote_session.discussion_phase_id, graphql_registry)
