# -*- coding: utf-8 -*-
from graphql_relay import to_global_id

from assembl.graphql.schema import Schema as schema


def test_graphql_get_discussion_text_multimedia(graphql_request,
                               graphql_registry,
                               user_language_preference_en_cookie,
                               discussion):
    res = schema.execute(
        graphql_registry['DiscussionQuery'],
        context_value=graphql_request,
        variable_values={"lang": "en"}
    )
    discussion = res.data['discussion']
    assert (not res.errors), res.errors
    assert discussion['textMultimediaTitle'] == 'Multimedia title EN'
    assert discussion['textMultimediaBody'] == 'Multimedia body EN'


def test_graphql_get_multilingual_discussion_text_multimedia(graphql_request, graphql_registry, discussion):
    res = schema.execute(
        graphql_registry['MultilingualDiscussionQuery'],
        context_value=graphql_request,
    )
    assert res.errors is None
    discussion = res.data['discussion']
    assert (not res.errors), res.errors
    assert discussion['textMultimediaTitleEntries'][0]['value'] == 'Multimedia title EN'
    assert discussion['textMultimediaBodyEntries'][0]['value'] == 'Multimedia body EN'


def test_graphql_update_discussion_text_multimedia(graphql_registry, graphql_request, discussion):
    from assembl import models
    discussion_id = to_global_id('Discussion', discussion.id)
    title_entries = [
        {
            "value": u"Multimedia title v2",
            "localeCode": u"en"
        },
        {
            "value": u"Titre multimédia v2",
            "localeCode": u"fr"
        }
    ]
    body_entries = [
        {
            "value": u"Text in english v2",
            "localeCode": u"en"
        },
        {
            "value": u"Texte en français v2",
            "localeCode": u"fr"
        }
    ]
    res = schema.execute(
        graphql_registry['updateDiscussionTextMultimedia'],
        context_value=graphql_request,
        variable_values={
            "id": discussion_id,
            "textMultimediaTitleEntries": title_entries,
            "textMultimediaBodyEntries": body_entries
        }
    )
    assert res.errors is None
    assert res.data is not None
    assert res.data['updateDiscussionTextMultimedia'] is not None
    discussion_data = res.data['updateDiscussionTextMultimedia']['discussion']
    assert sorted(discussion_data['textMultimediaTitleEntries'], key=lambda e: e['localeCode']) == title_entries
    assert sorted(discussion_data['textMultimediaBodyEntries'], key=lambda e: e['localeCode']) == body_entries

    new_discussion = models.Discussion.get(discussion.id)
    assert new_discussion.text_multimedia_body.closest_entry('en').value == u"Text in english v2"
    assert new_discussion.text_multimedia_body.closest_entry('fr').value == u"Texte en français v2"
    # no data destruction
    assert new_discussion.button_label.closest_entry('fr').value == u"Discuter des bananes"
