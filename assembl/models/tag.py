# -*- coding: utf-8 -*-
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    ForeignKey,
    func)

from . import Base


class Tag(Base):
    __tablename__ = "tag"
    id = Column(Integer, primary_key=True)
    value = Column(UnicodeText, unique=True)

    __mapper_args__ = {
        'polymorphic_identity': 'tag',
        'with_polymorphic': '*'
    }

    def __repr__(self):
        return "<Tag %s (%d)>" % (self.value, self.id or -1)

    @classmethod
    def get_tag(cls, tag, db=None):
        db = db or cls.default_db
        return db.query(cls).filter(func.lower(cls.value) == func.lower(tag)).first()

    @classmethod
    def get_tags(cls, tags, db=None):
        old_tags = []
        new_tags = []
        db = db or cls.default_db
        for tag in tags:
            tag_obj = cls.get_tag(tag, db)
            if not tag_obj:
                new_tags.append(cls(value=tag))
            else:
                old_tags.append(tag_obj)

        return {'new_tags': new_tags, 'tags': old_tags}


class TagsAssociation(Base):
    __tablename__ = 'tags_association'

    id = Column(Integer, primary_key=True)
    tag_id = Column(Integer, ForeignKey('tag.id'), nullable=False,)
    tag = relationship(Tag)

    __mapper_args__ = {
        'polymorphic_identity': 'tags_association',
        'with_polymorphic': '*'
    }


class ExtractsTagsAssociation(TagsAssociation):
    __tablename__ = 'extracts_tags_association'

    id = Column(Integer, ForeignKey(
        'tags_association.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)
    extract_id = Column(Integer, ForeignKey('extract.id'), nullable=False,)
    extract = relationship("Extract", back_populates="tags_associations")

    __mapper_args__ = {
        'polymorphic_identity': 'extracts_tags_association',
        'with_polymorphic': '*',
    }
