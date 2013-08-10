from assembl.tests.base import setUp, BaseTest
from assembl.synthesis.models import Idea, Discussion


import transaction

# PEP8
setUp = setUp


class ApiTest(BaseTest):
    def setUp(self):
        super(ApiTest, self).setUp()
        self.discussion = Discussion(slug='discussion_slug', topic='Test discussion')
        self.session.add(self.discussion)
        transaction.commit()
    
    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_extracts(self):
        res = self.app.get('/api/v1/discussion/%d/extracts' % (self.discussion.id))
        self.assertEqual(res.status_code, 200)
        

    
    def test_get_ideas(self):
        res = self.app.get('/api/ideas')
        self.assertEqual(res.status_code, 200)
        
