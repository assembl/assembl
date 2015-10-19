from loads.case import TestCase

no_gzip = {'Accept-Encoding': ''}

class TestWebSite(TestCase):

    def front_page_and_json_disconnected(self):
        self.assertEqual(self.app.get('/sandbox').status_code, 200)
        # self.assertEqual(self.app.get('/data/Discussion/6/all_users/current/local_roles').status_code, 200)
        # self.assertEqual(self.app.get('/api/v1/token').status_code, 200)
        # self.assertEqual(self.app.get('/socket/info').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/ideas').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/ideas/196?view=contributors').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/posts?view=id_only').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/posts?root_idea_id=local%3AIdea%2F196&order=chronological&view=id_only').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/ideas/196?view=contributors').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/posts?root_idea_id=local%3AIdea%2F196&order=chronological&view=id_only').status_code, 200)
        self.assertEqual(self.app.get('/data/Discussion/6/?_=1444820002494').status_code, 200)
        self.assertEqual(self.app.get('/data/Discussion/6/idea_links?_=1444820002495').status_code, 200)
        self.assertEqual(self.app.get('/api/v1/discussion/6/posts?ids%5B%5D=local%3AContent%2F641&ids%5B%5D=local%3AContent%2F4783&ids%5B%5D=local%3AContent%2F5091&ids%5B%5D=local%3AContent%2F4782&ids%5B%5D=local%3AContent%2F2090&ids%5B%5D=local%3AContent%2F2089&ids%5B%5D=local%3AContent%2F640&order=reverse_chronological&view=default').status_code, 200)
