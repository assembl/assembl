# -*- coding: utf-8 -*-

import uuid
import json
import transaction
from assembl.tests.base import BaseTest
from assembl.synthesis.models import (
    Idea,
    TableOfContents,
    Discussion,
    Extract,
    )
from assembl.auth.models import AgentProfile, User


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
        user = User(username="ben", profile=agent)
        discussion = Discussion(
            topic='Unicorns',
            slug='discussion_slug',
            table_of_contents=TableOfContents(),
            owner=user,
        )

        self.session.add(discussion)
        self.session.flush()
        self.session.refresh(discussion)

        return discussion
        
    def test_extracts(self):
        extract_id = '38ebdaac-c0f0-408e-8904-7f343851fc61'
        extract_data = {
            "idIdea": None,
            "author": {
                "name": "André Farzat",
                "avatarUrl": "http://www.gravatar.com/avatar/39cbf87dae724f2cb64e92accdd4d349.jpg"},
            "text": "Let's lower taxes to fav",
            "avatarUrl": None,
            "authorName": None,
            "idPost": None,
            "creationDate": 1376573216160,
            "id": "38ebdaac-c0f0-408e-8904-7f343851fc61"
        }

        ext = Extract(
            id=uuid.UUID('38ebdaac-c0f0-408e-8904-7f343851fc61'),
            order=0.0,
            body='asd',
            source_id='1',
        )
        self.session.add(ext)

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 0)

        url = self.get_url(self.discussion, 'extracts/%s' % extract_id)
        res = self.app.put(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        res_data = json.loads(res.body)

        url = self.get_url(self.discussion, 'extracts')
        res = self.app.get(url, json.dumps(extract_data))
        self.assertEqual(res.status_code, 200)
        extracts = json.loads(res.body)
        self.assertEquals(len(extracts), 1)

        obj = query.first()
        self.assertEqual(obj.id, extract_id)

        url = self.get_url(self.discussion, 'extracts')
        extracts = json.loads(self.app.get(url).body)
        self.assertEquals(len(extracts), 1)


    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_ideas(self):
        idea = Idea(
            long_title='This is a long test',
            short_title='This is a test',
            # table_of_contents=self.discussion.table_of_contents.id,
            table_of_contents=self.discussion.table_of_contents,
        )
        self.session.add(idea)
        self.session.flush()
        self.session.refresh(idea)

        url = self.get_url(self.discussion, 'ideas')
        res = self.app.get(url)
        self.assertEqual(res.status_code, 200)

        ideas = json.loads(res.body)
        self.assertEquals(len(ideas), 1)
        
