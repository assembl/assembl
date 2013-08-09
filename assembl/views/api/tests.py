from assembl.tests.base import setUp, BaseTest
from assembl.synthesis.models import Idea


# PEP8
setUp = setUp


class ApiTest(BaseTest):
    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)

    def test_get_ideas(self):
        res = self.app.get('/api/ideas')
        self.assertEqual(res.status_code, 200)
        
