# -*- coding: utf-8 -*-
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    ForeignKey,
    func)

from . import DiscussionBoundBase, Base, DeclarativeAbstractMeta


class TaggableEntity(Base):
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True
    tags_associations_cls = NotImplemented

    @declared_attr
    def tags_associations(cls):
        return relationship(cls.tags_associations_cls)

    @property
    def tags(self):
        return [te_association.tag for te_association in self.tags_associations]

    @tags.setter
    def tags(self, tags):
        current_tags = self.tags
        to_add = [tag for tag in tags if tag not in current_tags]
        to_remove = [te_a for te_a in self.tags_associations if te_a.tag not in tags]
        for te_a in to_remove:
            self.tags_associations.remove(te_a)
            self.db.delete(te_a)

        self.tags_associations.extend([self.tags_associations_cls(tag=tag) for tag in to_add])

    def replace_tag(self, tag, new_tag):
        to_remove = [te_a for te_a in self.tags_associations if te_a.tag is tag]
        for te_a in to_remove:
            self.tags_associations.remove(te_a)
            self.db.delete(te_a)

        self.tags_associations.append(self.tags_associations_cls(tag=new_tag))

    @classmethod
    def get_taggable_from_id(cls, taggable_type, id):
        taggables = {scls.__name__: scls for scls in cls.__subclasses__()}
        taggable = taggables.get(taggable_type, None)
        if taggable:
            return taggable.get(id)

        raise Exception("Is not a taggable Entity!")


class Keyword(DiscussionBoundBase):
    __tablename__ = "keyword"
    id = Column(Integer, primary_key=True)
    value = Column(UnicodeText, unique=True)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False, index=True)
    discussion = relationship("Discussion")
    __mapper_args__ = {
        'polymorphic_identity': 'keyword',
        'with_polymorphic': '*'
    }

    def __repr__(self):
        return "<Tag %s (%d)>" % (self.value, self.id or -1)

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    @classmethod
    def get_tag(cls, tag, discussion_id, db=None):
        db = db or cls.default_db
        return db.query(cls).filter(
            func.lower(cls.value) == func.lower(tag),
            cls.discussion_id == discussion_id
        ).first()

    @classmethod
    def get_tags(cls, tags, discussion_id, db=None):
        old_tags = []
        new_tags = []
        db = db or cls.default_db
        for tag in tags:
            tag_obj = cls.get_tag(tag, discussion_id, db)
            if not tag_obj:
                new_tags.append(cls(value=tag, discussion_id=discussion_id))
            else:
                old_tags.append(tag_obj)

        return {'new_tags': new_tags, 'tags': old_tags}


class TagsAssociation(Base):
    __tablename__ = 'tags_association'
    id = Column(Integer, primary_key=True)
    tag_id = Column(Integer, ForeignKey('keyword.id'), nullable=False,)
    tag = relationship(Keyword)
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
