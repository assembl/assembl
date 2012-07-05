from datetime import datetime
import json
import unittest

from webtest import TestApp

from pyramid import testing

from ... import main
from ...api import post as api
from ...lib.alembic import bootstrap_db
from ...models import DBSession as db


class TestPostAPI(unittest.TestCase):
    global_settings = {'__file__': '<test config>'}
    settings = {'sqlalchemy.url': 'sqlite:///:memory:',
                'app.skip_migration': True}

    def setUp(self):
        self.app = main(self.global_settings, **self.settings)
        self.testapp = TestApp(self.app)
        bootstrap_db(engine=db.bind, with_migration=False)

    def tearDown(self):
        db.remove()

    def s(self, values):
        """Serialize values."""
        return api.validator(include=values.keys()).serialize(values)

    def d(self, values):
        """Deserialize values."""
        return api.validator(include=values.keys()).deserialize(values)

    def l(self, result, wanted=None):
        """Return JSON-decoded values, optionally excluding unwanted keys."""
        result = json.loads(result.body)
        if wanted is not None:
            for k in result.keys():
                if not k in wanted:
                    del result[k]
        return result

    def test_crud(self):
        request = testing.DummyRequest()
        values = self.s(dict(author=u'me', subject=u'test',
                             date=datetime.utcnow(), body=u'clever stuff'))
        result = self.testapp.post('/api/post/', values, status=200)
        r = self.l(result, values)
        self.assertEqual(self.d(values), self.d(r))
        result = self.l(result)

        post = self.testapp.get('/api/post/%d' % result['id'], status=200)
        self.assertEqual(result, self.l(post))

        values['author'] = u'them'
        result = self.testapp.put('/api/post/%d' % result['id'],
                                  dict(author=u'them'), status=200)
        r = self.l(result, values)
        self.assertEqual(self.d(values), self.d(r))
        result = self.l(result)

        post = self.testapp.get('/api/post/%d' % result['id'], status=200)
        self.assertEqual(result, self.l(post))

        post = self.testapp.delete('/api/post/%d' % result['id'],
                                status=200)
        self.assertTrue(self.l(post)['result'])
        self.testapp.get('/api/post/%d' % result['id'], status=404)
