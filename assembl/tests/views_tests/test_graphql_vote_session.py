# -*- coding: utf-8 -*-

from assembl.graphql.schema import Schema as schema
from assembl.lib.utils import snake_to_camel


def assert_langstring_is_equal(langstring_name, fetched_model, source_model):
    source_value = getattr(source_model, langstring_name).entries[0].value
    fetched_value = fetched_model[snake_to_camel(langstring_name) + 'Entries'][0]['value']
    assert source_value == fetched_value


def assert_langstrings_are_equal(langstrings_names, fetched_model, source_model):
    for langstring_name in langstrings_names:
        assert_langstring_is_equal(langstring_name, fetched_model, source_model)


fragments = u"""
    fragment voteSessionGlobals on VoteSession {
      headerImage {
        title
        mimeType
        externalUrl
      }
    }

    fragment langStringEntry on LangStringEntry {
      localeCode
      value
    }

    fragment voteSessionLangstringsEntries on VoteSession {
      titleEntries {
        ...langStringEntry
      }
      subTitleEntries {
        ...langStringEntry
      }
      instructionsSectionTitleEntries {
        ...langStringEntry
      }
      instructionsSectionContentEntries {
        ...langStringEntry
      }
      propositionsSectionTitleEntries {
        ...langStringEntry
      }
    }
"""


def en_value(entry):
    return entry[0]['value']


def test_graphql_get_vote_session(graphql_unauthenticated_request, vote_session):
    response = schema.execute(
        fragments + u"""
            query VoteSession($discussionPhaseId: Int!) {
                voteSession(discussionPhaseId: $discussionPhaseId) {
                    ...voteSessionGlobals
                    ...voteSessionLangstringsEntries
                }
            }
        """,
        context_value=graphql_unauthenticated_request,
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


def en_entry(value):
    return [{"localeCode": "en", "value": value}]


def mutate_and_assert(graphql_request, discussion_phase_id, test_app):
    new_title = u"updated vote session title"
    new_sub_title = u"updated vote session sub title"
    new_instructions_section_title = u"updated vote session instructions title"
    new_instructions_section_content = u"updated vote session instructions content"
    new_propositions_section_title = u"updated vote session propositions section title"

    import os
    from io import BytesIO

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
        fragments + u"""
            mutation UpdateVoteSession(
              $discussionPhaseId: Int!
              $headerImage: String
              $titleEntries: [LangStringEntryInput]
              $subTitleEntries: [LangStringEntryInput]
              $instructionsSectionTitleEntries: [LangStringEntryInput]
              $instructionsSectionContentEntries: [LangStringEntryInput]
              $propositionsSectionTitleEntries: [LangStringEntryInput]
            ) {
              updateVoteSession(
                discussionPhaseId: $discussionPhaseId
                headerImage: $headerImage
                titleEntries: $titleEntries
                subTitleEntries: $subTitleEntries
                instructionsSectionTitleEntries: $instructionsSectionTitleEntries
                instructionsSectionContentEntries: $instructionsSectionContentEntries
                propositionsSectionTitleEntries: $propositionsSectionTitleEntries
              ) {
                voteSession {
                  ...voteSessionGlobals
                  ...voteSessionLangstringsEntries
                }
              }
            }
        """,
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


def test_graphql_update_vote_session(graphql_request, vote_session, test_app):
    mutate_and_assert(graphql_request, vote_session.discussion_phase_id, test_app)


simple_get_query = u"""
    query VoteSesion($discussionPhaseId: Int!) {
        voteSession(discussionPhaseId: $discussionPhaseId) {
            id
        }
    }
"""


def vote_session_not_created(discussion_phase_id, graphql_request):
    response = schema.execute(
        simple_get_query,
        context_value=graphql_request,
        variable_values={"discussionPhaseId": discussion_phase_id}
    )
    return (response.errors is None) and (response.data['voteSession'] is None)


def test_graphql_create_vote_session(graphql_request, timeline_vote_session, test_app):
    assert vote_session_not_created(timeline_vote_session.id, graphql_request)
    mutate_and_assert(graphql_request, timeline_vote_session.id, test_app)


def test_graphql_create_vote_session_unauthenticated(graphql_unauthenticated_request, timeline_vote_session, test_app):
    assert vote_session_not_created(timeline_vote_session.id, graphql_unauthenticated_request)
    mutate_and_assert_fail(graphql_unauthenticated_request, timeline_vote_session.id)


def mutate_and_assert_fail(graphql_request, discussion_phase_id):
    new_title = u"updated vote session title"
    response = schema.execute(
        u"""
            mutation UpdateVoteSession(
              $discussionPhaseId: Int!
              $headerImage: String
              $titleEntries: [LangStringEntryInput]
              $subTitleEntries: [LangStringEntryInput]
              $instructionsSectionTitleEntries: [LangStringEntryInput]
              $instructionsSectionContentEntries: [LangStringEntryInput]
              $propositionsSectionTitleEntries: [LangStringEntryInput]
            ) {
              updateVoteSession(
                discussionPhaseId: $discussionPhaseId
                headerImage: $headerImage
                titleEntries: $titleEntries
                subTitleEntries: $subTitleEntries
                instructionsSectionTitleEntries: $instructionsSectionTitleEntries
                instructionsSectionContentEntries: $instructionsSectionContentEntries
                propositionsSectionTitleEntries: $propositionsSectionTitleEntries
              ) {
                voteSession {
                  id
                }
              }
            }
        """,
        context_value=graphql_request,
        variable_values={
            "discussionPhaseId": discussion_phase_id,
            "titleEntries": [{"localeCode": "en", "value": new_title}]
        }
    )

    assert ("wrong credentials" in response.errors[0].message)


def test_graphql_update_vote_session_unauthenticated(graphql_unauthenticated_request, vote_session):
    mutate_and_assert_fail(graphql_unauthenticated_request, vote_session.discussion_phase_id)
