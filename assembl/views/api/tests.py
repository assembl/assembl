from assembl.tests.base import setUp, BaseTest


# PEP8
setUp = setUp


class ApiTest(BaseTest):
    def test_homepage_returns_200(self):
        res = self.app.get('/')
        self.assertEqual(res.status_code, 200)
