
import unittest

from sqlalchemy import Column, Integer

from pyramid import testing

from ...models import Base, DBSession as db
from ...models.toc import Document, HasDocument


class MustHaveDocument(HasDocument, Base):
    """Will test the HasDocument mixin with this class."""
    __tablename__ = 'must_have_document'
    id = Column(Integer, primary_key=True)


class TestTocModels(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        engine = create_engine('sqlite:///:memory:')
        db.configure(bind=engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        db.remove()
        testing.tearDown()

    def test_hasdocument(self):
        instance = MustHaveDocument()
        self.assertTrue(hasattr(instance, 'document'))
        self.assertTrue(hasattr(instance.document, 'must_have_document'))
        self.assertIsInstance(instance.document, Document)
