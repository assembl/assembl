import json
from assembl.tests.base import setUp, tearDown, BaseTest
from assembl.synthesis.models import Idea, TableOfContents, Discussion
from assembl.auth.models import AgentProfile


# PEP8
setUp = setUp
tearDown = tearDown


class ApiTest(BaseTest):
    def setUp(self):
        super(ApiTest, self).setUp()


    def create_dummy_discussion(self):
        discussion = Discussion(
            topic='Unicorns',
            table_of_contents=TableOfContents(),
            owner=AgentProfile(
                name='John Doe',
            ),
        )
        return discussion
        

    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_ideas(self):
        idea = Idea(
            long_title='This is a long test',
            short_title='This is a test',
            # table_of_contents=self.discussion.table_of_contents.id,
            table_of_contents=self.create_dummy_discussion().table_of_contents,
        )
        self.session.add(idea)
        self.session.flush()
        self.session.refresh(idea)

        res = self.app.get('/api/ideas')
        self.assertEqual(res.status_code, 200)

        ideas = json.loads(res.body)
        self.assertEquals(len(ideas), 1)
        
