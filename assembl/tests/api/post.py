from datetime import datetime
import unittest

from sqlalchemy.orm.exc import NoResultFound
import transaction

from pyramid import testing

from ...api.post import PostAPI
from ...models import Base, DBSession as db


class TestPostAPI(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        engine = create_engine('sqlite:///:memory:')
        db.configure(bind=engine)
        Base.metadata.create_all(engine)
        self.api = PostAPI()

    def tearDown(self):
        db.remove()
        testing.tearDown()

    def test_crud(self):
        values = dict(author=u'me', subject=u'test', date=datetime.utcnow(),
                      body=u'clever stuff')
        with transaction.manager:
            post = self.api.create(**values)
            self.assertEqual(dict(post.iteritems(include=values.keys())),
                             values)
            self.assertIs(post.id, None)
            post.save()

        post = self.api.get(author=u'me')
        self.assertEqual(dict(post.iteritems(include=values.keys())), values)

        with transaction.manager:
            values['author'] = u'them'
            post = self.api.update(post, author=u'them')
            self.assertEqual(dict(post.iteritems(include=values.keys())),
                             values)
            post.save()

        post = self.api.get(author=u'them')
        self.assertRaises(NoResultFound, self.api.get, author=u'me')

        with transaction.manager:
            self.api.delete(author=u'them')
        self.assertRaises(NoResultFound, self.api.get, author=u'them')
