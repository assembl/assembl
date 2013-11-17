# -*- coding: utf-8 -*-

import uuid
import json
import transaction
from assembl.tests.base import BaseTest
from assembl.source.models import Source, Content, Post
from assembl.synthesis.models import (
    Idea,
    TableOfContents,
    Discussion,
    Extract,
    )
from assembl.auth.models import (
    AgentProfile, User, Role, UserRole, Username, R_ADMINISTRATOR,
    create_default_permissions, populate_default_permissions,
    populate_default_roles, Permission)


class ApiTest(BaseTest):
    def setUp(self):
        super(ApiTest, self).setUp()
        self.discussion = self.create_dummy_discussion()

    def get_url(self, discussion, suffix):
        return '/api/v1/discussion/%d/%s' % (
            discussion.id,
            suffix,
        )

    def create_dummy_discussion(self):
        agent = AgentProfile(name="Dummy agent")
        user = User(profile=agent)
        username = Username(username="ben", user=user)
        discussion = Discussion(
            topic='Unicorns',
            slug='discussion_slug',
            table_of_contents=TableOfContents(),
            owner=user,
        )

        self.session.add(discussion)
        self.session.add(username)
        create_default_permissions(self.session, discussion)
        self.session.add(UserRole(
            user=user, role=Role.get_role(
                self.session, R_ADMINISTRATOR)))
        self.session.flush()
        self.config.testing_securitypolicy(userid=user.id, permissive=True)
        return discussion

    def test_extracts(self):
        extract_user = {
            "id": 2,
            "name": "André Farzat",
            "type": "agent_profile"}
        extract_data = {
            "idIdea": None,
            "creator": extract_user,
            "owner": extract_user,
            "text": "Let's lower taxes to fav",
            "creationDate": 1376573216160,
            "target": {
                "@type": "email",
            }
        }

        creator = AgentProfile(id=2, name="André Farzat", type="agent_profile")
        source = Source(name='a source', type='source', discussion=self.discussion)
        post = Post(creator=creator)
        content = Content(source=source, type='content', post=post)
        ext = Extract(
            order=0.0,
            body='asd',
            creator=creator,
            owner=creator,
            source=content
        )
        self.session.add(ext)
        self.session.add(post)
        self.session.flush()
        extract_data["target"]['@id'] = post.id
        assert self.session.query(Post).get(post.id)

        if self.zopish:
            transaction.commit()
            self.session = self.session_factory()
            post = self.session.merge(post)
            self.discussion = self.session.merge(self.discussion)

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 1)

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.post(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        res_data = json.loads(res.body)
        extract_id = int(res_data['id'])

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 2)

        self.assertTrue(extract_id in [e['id'] for e in extracts])

    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_ideas(self):
        idea = Idea(
            long_title='This is a long test',
            short_title='This is a test',
            table_of_contents=self.discussion.table_of_contents,
        )
        self.session.add(idea)
        if self.zopish:
            transaction.commit()
            self.session = self.session_factory()
            self.discussion = self.session.merge(self.discussion)
        url = self.get_url(self.discussion, 'ideas')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)

        ideas = json.loads(res.body)
        self.assertEquals(len(ideas), 2) # orphan_posts
        
