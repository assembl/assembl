# -*- coding: utf-8 -*-

from assembl.graphql.schema import Schema as schema

def snake_to_camel(string):
    # https://stackoverflow.com/questions/19053707/converting-snake-case-to-lower-camel-case-lowercamelcase
    components = string.split('_')
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    return components[0] + "".join(x.title() for x in components[1:])

def assert_langstring_is_equal(langstring_name, fetched_model, source_model):
    source_value = getattr(source_model, langstring_name).entries[0].value
    fetched_value = fetched_model[snake_to_camel(langstring_name) + 'Entries'][0]['value']
    assert source_value == fetched_value

def assert_langstrings_are_equal(langstrings_names, fetched_model, source_model):
    for langstring_name in langstrings_names:
        assert_langstring_is_equal(langstring_name, fetched_model, source_model)

def test_graphql_get_vote_session(graphql_request, vote_session):
    response = schema.execute(
        u"""
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

            query VoteSession($discussionPhaseId: Int!) {
                voteSession(discussionPhaseId: $discussionPhaseId) {
                    ...voteSessionGlobals
                    ...voteSessionLangstringsEntries
                }
            }
        """,
        context_value=graphql_request,
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

def test_graphql_update_vote_session(graphql_request, vote_session):
    new_title = u"updated vote session title"
    response = schema.execute(
        u"""
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
            "discussionPhaseId": vote_session.discussion_phase_id,
            "titleEntries": [ { "localeCode": "en", "value": new_title } ]
        }
    )

    assert response.errors is None
    fetched_vote_session = response.data['updateVoteSession']['voteSession']

    fetched_title = fetched_vote_session['titleEntries'][0]['value']
    assert fetched_title == new_title
