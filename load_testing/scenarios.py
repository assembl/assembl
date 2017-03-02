import re
import json
from urllib import quote
from loads.case import TestCase

no_gzip = {'Accept-Encoding': ''}


class TestWebSite(TestCase):

    def front_page_and_json_disconnected(self):
        data = {'slug': "sandbox"}
        self.app.lint = False

        def test(url):
            result = self.app.get(url.format(**data), headers=no_gzip)
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

    def notification_subscriptions(self):
        self.app.lint = False
        # create a user with
        # assembl-add-user -m test@example.com -p test -d sandbox -l r:participant -n 'Test User' -u test local.ini
        # if you want to run uwsgi from command line, add  --ini-paste-logged for logging
        # Clear the discussion's (assuming id 6) NotificationSubscriptions with the following in pshell:
        # for n in db.query(models.NotificationSubscription).filter_by(discussion_id=6):
        #    n.delete()
        # db.commit()
        # At the end of the test, this should be empty:
        # db.query(models.NotificationSubscription.discussion_id,
        #            models.NotificationSubscription.user_id,
        #            models.NotificationSubscription.type,
        #            func.count(models.NotificationSubscription.id)).group_by(
        #            models.NotificationSubscription.discussion_id,
        #            models.NotificationSubscription.user_id,
        #            models.NotificationSubscription.type).having(
        #            func.count(models.NotificationSubscription.id)>1).all()
        # run with
        # loads-runner scenarios.TestWebSite.notification_subscriptions  --server-url http://localhost:8080/  -u 4 --hits 4
        user_info = {'identifier': 'test@example.com', 'password': 'test'}
        data = {'slug': 'sandbox'}

        def test(url, json=False):
            result = self.app.get(url.format(**data), headers=no_gzip)
            self.assertEqual(result.status_code, 200)
            if json:
                return result.json
            else:
                return result._app_iter[0]

        self.app.post('/login', user_info, headers=no_gzip)

        d1 = test('/data/Discussion/{slug}', True)
        data['discussion_id'] = int(d1['@id'].split('/')[-1])

        test('/data/Discussion/{discussion_id}/user_templates/-/notification_subscriptions')
        test('/data/Discussion/{discussion_id}/all_users/current/notification_subscriptions')
