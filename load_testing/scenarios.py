import re
import json
from urllib import quote
from loads.case import TestCase

no_gzip = {'Accept-Encoding': ''}


class TestWebSite(TestCase):

    def front_page_and_json_disconnected(self):
        data = {'slug': "sandbox"}

        def test(url):
            result = self.app.get(url.format(**data))
            self.assertEqual(result.status_code, 200)
            return result._app_iter[0]

        front_page = test('/{slug}')
        match = re.search('id="discussion-id" value="([0-9]+)"', front_page)
        assert match
        data['disc_id'] = int(match.group(1))

        # test('/data/Discussion/{disc_id}/all_users/current/local_roles')
        # test('/api/v1/token')
        # test('/socket/info')
        ideas = test('/api/v1/discussion/{disc_id}/ideas')
        ideas = json.loads(ideas)
        data['idea'] = int(ideas[1]['@id'].split('/')[1])
        test('/api/v1/discussion/{disc_id}/ideas/{idea}?view=contributors')
        posts = test('/api/v1/discussion/{disc_id}/posts?view=id_only')
        posts = json.loads(posts)['posts']
        data['posts'] = '&'.join(['ids%5B%5D='+quote(p['@id']) for p in posts])
        test('/api/v1/discussion/{disc_id}/posts?root_idea_id=local%3AIdea%2F{idea}&order=chronological&view=id_only')
        test('/api/v1/discussion/{disc_id}/ideas/{idea}?view=contributors')
        test('/data/Discussion/{disc_id}/')
        test('/data/Discussion/{disc_id}/idea_links')
        test('/api/v1/discussion/{disc_id}/posts?{posts}&order=reverse_chronological&view=default')
