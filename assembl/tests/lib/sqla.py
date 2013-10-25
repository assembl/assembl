import unittest

from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm.exc import NoResultFound
import transaction

from pyramid import testing

from ...lib.sqla import BaseOps, Base, TimestampedBase, get_session_maker


db = get_session_maker()


class BaseModel(BaseOps, Base):
    id = Column(Integer, primary_key=True)
    name = Column(Text)


class StampedModel(TimestampedBase):
    id = Column(Integer, primary_key=True)
    name = Column(Text)


class TestSAUtils(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        engine = create_engine('sqlite:///:memory:')
        db.configure(bind=engine)
        Base.metadata.create_all(engine)
        TimestampedBase.metadata.create_all(engine)

    def tearDown(self):
        db.remove()
        testing.tearDown()

    def test_baseops_tablename(self):
        self.assertTrue(hasattr(BaseModel, '__tablename__'))
        self.assertEqual(BaseModel.__tablename__, 'base_model')

    def test_baseops_get(self):
        self.assertEqual(BaseModel.get(name='one'), None)
        self.assertRaises(NoResultFound, BaseModel.get, name='one',
                          raise_=True)

    def test_baseops(self):
        with transaction.manager:
            bmodel = BaseModel(name='one')
            bmodel.save(flush=False)
            self.assertIs(bmodel.id, None)
            bmodel = BaseModel(name='two')
            bmodel.save()
            self.assertIs(bmodel.id, None)
            bmodel.save(flush=True)
            self.assertIsNot(bmodel.id, None)
        bmodel = BaseModel.get(name='one')
        self.assertIsNot(bmodel.id, None)
        self.assertEqual(bmodel.name, 'one')
        with transaction.manager:
            bmodel.delete()
        self.assertEqual(BaseModel.get(name='one'), None)

    def test_stamps(self):
        bmodel = BaseModel(name='one')
        self.assertFalse(hasattr(bmodel, 'ins_date'))
        self.assertFalse(hasattr(bmodel, 'mod_date'))
        smodel = StampedModel(name='two')
        self.assertTrue(hasattr(smodel, 'ins_date'))
        self.assertTrue(hasattr(smodel, 'mod_date'))

    def test_iteritems(self):
        bmodel = BaseModel(name='one')
        smodel = StampedModel(name='two')
        self.assertEqual(dict(bmodel.iteritems()), dict(id=None, name='one'))
        self.assertEqual(dict(smodel.iteritems()), dict(id=None, name='two'))
        self.assertEqual(len(dict(bmodel.iteritems(include=['id']))), 1)
        self.assertEqual(len(dict(smodel.iteritems(exclude=['id']))), 1)
        self.assertEqual(len(dict(smodel.iteritems(include=['id', 'name'],
                                                   exclude=['name']))), 1)
