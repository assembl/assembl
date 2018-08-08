# -*- coding=utf-8 -*-
import datetime

from assembl.indexing.utils import get_data


def test_get_data(extract_submitted_in_post_related_to_sub_idea_1_1_1, participant2_user, post_related_to_sub_idea_1_1_1, subidea_1_1_1):
    extract = extract_submitted_in_post_related_to_sub_idea_1_1_1
    uid, data = get_data(extract)
    assert uid == 'extract:{}'.format(extract.id)
    assert data['id'] == extract.id
    assert data['post_id'] == post_related_to_sub_idea_1_1_1.id
    assert data['creator_id'] == participant2_user.id
    assert data['discussion_id'] == extract.discussion.id
    assert data['idea_id'] == [subidea_1_1_1.id]
    assert data['phase_id'] == u'thread'
    assert data['body'] == u"Commodi maiores magni rerum. Sint natus corporis in qui in ut dignissimos cumque repellendus. Reprehenderit nihil illum."
    assert data['extract_state'] == u'PUBLISHED'
    assert data['creation_date'].date() == datetime.date(2018, 8, 7)
    assert data['extract_nature'] == 'taxonomy_nature.actionable_solution'
    assert data['extract_action'] == 'taxonomy_action.give_examples'
    assert data['creator_display_name'] == u'James T. Expert'
    assert data['subject_other'] == u'A post related to sub_idea_1_1_1 '
