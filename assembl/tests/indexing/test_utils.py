# -*- coding=utf-8 -*-
import datetime

from assembl.indexing.utils import get_data


def test_get_data(extract_post_1_to_subidea_1_1):
    extract = extract_post_1_to_subidea_1_1
    uid, data = get_data(extract)
    assert uid == 'extract:1'
    assert data['id'] == extract.id
    assert data['post_id'] == extract.content.id
    assert data['creator_id'] == extract.creator.id
    assert data['discussion_id'] == extract.discussion.id
    assert data['idea_id'] == extract.idea_id
    assert data['phase_id'] == u'thread'
    assert data['body'] == u'body'
    assert data['extract_state'] == u'PUBLISHED'
    assert data['creation_date'].date() == datetime.date(2018, 8, 7)
    assert data['extract_nature'] == 'taxonomy_nature.actionable_solution'
    assert data['extract_action'] == 'taxonomy_action.give_examples'
    assert data['creator_display_name'] == u'James T. Expert'
    assert data['subject_other'] == u're1: root post'
