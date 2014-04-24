# -*- coding: utf-8 -*-

import json
from urllib import urlencode

from assembl.models.synthesis import (
    Idea,
)


def get_url(discussion, suffix):
    return '/api/v1/discussion/%d/%s' % (
        discussion.id,
        suffix,
    )


def test_extracts(
        discussion, participant1_user, reply_post_2, test_app, extract):
    user = participant1_user
    extract_user = {
        "@id": 'local:AgentProfile/'+str(user.id),
        "name": user.name,
        "@type": "User"}
    extract_data = {
        "idIdea": None,
        "creator": extract_user,
        "owner": extract_user,
        "text": "Let's lower taxes to fav",
        "creationDate": 1376573216160,
        "target": {
            "@type": "email",
            "@id": 'local:Post/'+str(reply_post_2.id)
        }
    }

    url = get_url(discussion, 'extracts')
    res = test_app.get(url)
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 1

    url = get_url(discussion, 'extracts')
    res = test_app.post(url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_id = res_data['id']

    url = get_url(discussion, 'extracts')
    res = test_app.get(url, json.dumps(extract_data))
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 2

    assert extract_id in [e['@id'] for e in extracts]


def test_homepage_returns_200(test_app):
    res = test_app.get('/')
    assert res.status_code == 200


def test_get_ideas(discussion, test_app, test_session):
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    num_ideas = len(ideas)

    idea = Idea(
        long_title='This is a long test',
        short_title='This is a test',
        discussion=discussion
    )
    test_session.add(idea)
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    assert len(ideas) == num_ideas+1


def test_get_posts_from_idea(
        discussion, test_app, test_session, subidea_1,
        subidea_1_1, subidea_1_1_1, extract, reply_post_2):
    base_url = get_url(discussion, 'posts')
    url = base_url + "?" + urlencode({"root_idea_id": subidea_1.uri()})
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 0
    url = base_url + "?" + urlencode({"root_idea_id": subidea_1_1.uri()})
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 2

def test_mailbox_import_jacklayton(discussion, test_app, jack_layton_mailbox):
    base_url = get_url(discussion, 'posts')
    url = base_url
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 20
    jack_layton_mailbox.do_import_content(jack_layton_mailbox, True)
    assert res_data['total'] == 20, "No duplicate messages should have been imported, but there are now %d messages" % res_data['total']
    