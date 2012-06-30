from datetime import datetime
from email.message import Message
import unittest

from sqlalchemy.orm.exc import NoResultFound
import transaction

from pyramid import testing

from ...api.post import PostAPI
from ...lib.email import add_header, formatdate
from ...models import Base, DBSession as db
from ...models.post import msg_id

#########  type,  id, parent
POSTS = [('post',  1, None),
         ('post',  2, 1),
         ('post',  3, 2),
         ('email', 4, 1),
         ('post',  5, 4),
         ('email', 6, None)]


class TestPostAPI(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        engine = create_engine('sqlite:///:memory:')
        db.configure(bind=engine)
        Base.metadata.create_all(engine)
        self.post_api = PostAPI()
        self._posts = dict()
        self._emails = dict()

    def tearDown(self):
        db.remove()
        testing.tearDown()

    def test_crud(self):
        values = dict(author=u'me', subject=u'test', date=datetime.utcnow(),
                      body=u'clever stuff')
        with transaction.manager:
            post = self.post_api.create(**values)
            self.assertEqual(dict(post.iteritems(include=values.keys())),
                             values)
            self.assertIs(post.id, None)
            post.save()

        post = self.post_api.get(author=u'me')
        self.assertEqual(dict(post.iteritems(include=values.keys())), values)

        with transaction.manager:
            values['author'] = u'them'
            post = self.post_api.update(post, author=u'them')
            self.assertEqual(dict(post.iteritems(include=values.keys())),
                             values)
            post.save()

        post = self.post_api.get(author=u'them')
        self.assertRaises(NoResultFound, self.post_api.get, author=u'me')

        with transaction.manager:
            self.post_api.delete(author=u'them')
        self.assertRaises(NoResultFound, self.post_api.get, author=u'them')

    def test_threading(self):
        with transaction.manager:
            values = dict(date=datetime.utcnow(), subject=u'subject',
                          author=u'author', body=u'bla', message_id=msg_id())
            post = self.post_api.create(**values)
            email = Message()
            email.set_payload(values['body'], 'us-ascii')
            add_header(email, 'Date', values['date'], formatdate)
            add_header(email, 'From', values['author'])
            add_header(email, 'Subject', values['subject'])
            add_header(email, 'Message-ID', msg_id(), str)
            add_header(email, 'In-Reply-To', post.message_id, str)
            self.post_api.create(email_text=str(email))

        with transaction.manager:
            self.post_api.thread(self.post_api.list())

        posts = [(p.id, p) for p in self.post_api.list()]
        posts.sort()
        (_, p1), (_, p2) = posts
        self.assertEqual(p1.id, p2.parent_id)
