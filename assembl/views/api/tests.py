# -*- coding: utf-8 -*-

import uuid
import json
import transaction
import traceback
from nose.plugins.skip import Skip

from assembl.tests.base import BaseTest
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
from assembl.tests import get_fixture
from assembl.tests.fixtures import setup_data


class ApiTest(BaseTest):
    def setUp(self):
        super(ApiTest, self).setUp()
        self.fixture = get_fixture(self.session_factory)
        try:
            self.data = setup_data(self.fixture)
        except Exception as e:
            traceback.print_exc()
            raise e
        self.discussion = self.data.DiscussionData.jacklayton._stored_object()
        role = Role.get_role(self.session, R_SYSADMIN)
        self.data.UserRoleData.admin_role.role = role
        self.session.flush()
        dummy_policy = self.config.testing_securitypolicy(
            userid=self.data.UserData.admin.id, permissive=True)
        self.config.set_authorization_policy(dummy_policy)
        self.config.set_authentication_policy(dummy_policy)

    def tearDown(self):
        self.data.teardown()
        super(ApiTest, self).tearDown()

    def get_url(self, discussion, suffix):
        return '/api/v1/discussion/%d/%s' % (
            discussion.id,
            suffix,
        )

    def test_extracts(self):
        user = self.data.UserData.participant1
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
                "@id": 'local:Post/'+str(self.data.PostData.reply_post_1.id)
            }
        }

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 1)

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.post(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        res_data = json.loads(res.body)
        extract_id = res_data['id']

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 2)

        self.assertIn(extract_id, [e['@id'] for e in extracts])

    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_ideas(self):
        url = self.get_url(self.discussion, 'ideas')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)

        ideas = json.loads(res.body)
        num_ideas = len(ideas)

        idea = Idea(
            long_title='This is a long test',
            short_title='This is a test',
            discussion=self.discussion
        )
        self.session.add(idea)
        url = self.get_url(self.discussion, 'ideas')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)

        ideas = json.loads(res.body)
        self.assertEquals(len(ideas), num_ideas+1)
