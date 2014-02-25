# -*- coding: utf-8 -*-

import uuid
import json
import transaction
import traceback

import pytest

from assembl.source.models import PostSource, Content, Post
from assembl.synthesis.models import (
    Idea,
    TableOfContents,
    Discussion,
    Extract,
)
from assembl.auth.models import (
    AgentProfile, User, Role, UserRole, Username, R_SYSADMIN,
    create_default_permissions, populate_default_permissions,
    populate_default_roles, Permission)
from assembl.tests.pytest_fixtures import *


def get_url(discussion, suffix):
    return '/api/v1/discussion/%d/%s' % (
        discussion.id,
        suffix,
    )


def test_extracts(discussion, participant1_user, reply_post_2, test_app, extract):
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


def test_get_ideas(discussion, test_app, module_session):
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
    module_session.add(idea)
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    assert len(ideas) == num_ideas+1
