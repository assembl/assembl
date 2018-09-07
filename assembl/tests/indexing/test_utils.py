# -*- coding=utf-8 -*-
import datetime

from assembl.indexing.utils import get_data


def test_get_data_for_extract(extract_submitted_in_post_related_to_sub_idea_1_1_1, participant2_user, post_related_to_sub_idea_1_1_1, subidea_1_1_1):
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
    assert data['extract_state'] == u'taxonomy_state.PUBLISHED'
    assert data['creation_date'].date() == datetime.date.today()
    assert data['extract_nature'] == 'taxonomy_nature.actionable_solution'
    assert data['extract_action'] == 'taxonomy_action.give_examples'
    assert data['creator_display_name'] == u'James T. Expert'
    assert data['subject_other'] == u'A post subject related to sub_idea_1_1_1'


def test_get_data_for_post(admin_user, post_related_to_sub_idea_1_1_1, subidea_1_1_1):
    post = post_related_to_sub_idea_1_1_1
    uid, data = get_data(post)
    assert uid == 'post:{}'.format(post.id)
    assert data['id'] == post.id
    assert data['body_other'] == u'A post body related to sub_idea_1_1_1'
    assert data['creator_id'] == admin_user.id
    assert data['_parent'] == 'user:{}'.format(admin_user.id)
    assert data['discussion_id'] == post.discussion.id
    assert data['idea_id'] == [subidea_1_1_1.id]
    assert data['phase_id'] == u'thread'
    assert data['creation_date'] == datetime.datetime(2018, 2, 17, 9, 0)
    assert data['creator_display_name'] == u'Mr. Administrator'
    assert data['sentiment_counts'] == {
        'consensus': 0,
        'controversy': 1,
        'disagree': 0,
        'dont_understand': 0,
        'like': 0,
        'more_info': 0,
        'popularity': 0,
        'total': 0}
    assert data['sentiment_tags'] == []
    assert data['subject_other'] == u'A post subject related to sub_idea_1_1_1'
    assert data['type'] == 'post'


def test_get_data_for_synthesis_post(participant1_user, synthesis_post_1):
    post = synthesis_post_1
    uid, data = get_data(post)
    assert uid == 'synthesis:{}'.format(post.id)
    assert data['id'] == post.id
    assert data['conclusion_en'] == u'conclusion EN'
    assert data['conclusion_fr'] == u'conclusion FR'
    assert data['introduction_en'] == u'introduction EN'
    assert data['introduction_fr'] == u'introduction FR'
    assert data['subject_en'] == u'subject EN'
    assert data['subject_fr'] == u'subject FR'
    assert data['creator_id'] == participant1_user.id
    assert data['_parent'] == 'user:{}'.format(participant1_user.id)
    assert data['parent_id'] is None
    assert data['discussion_id'] == post.discussion.id
    assert data['creation_date'] == datetime.datetime(2020, 1, 3, 0, 0)
    assert data['creator_display_name'] == u'A. Barking Loon'
    assert data['sentiment_counts'] == {
        'consensus': 0,
        'controversy': 1,
        'disagree': 0,
        'dont_understand': 0,
        'like': 0,
        'more_info': 0,
        'popularity': 0,
        'total': 0}
    assert data['sentiment_tags'] == []
    assert data['type'] == 'synthesis_post'
