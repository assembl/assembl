from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    UnicodeText,
    DateTime,
    Time,
    Binary,
    desc,
    Index
)

from sqlalchemy.orm import relationship, backref
from sqlalchemy.types import Text
from virtuoso.vmapping import IriClass

from . import Base, DiscussionBoundBase, DiscussionBoundTombstone
from ..semantic.namespaces import (
    SIOC, ASSEMBL, CATALYST, QUADNAMES, VERSION, FOAF, DCTERMS, RDF, VirtRDF)
from ..semantic.virtuoso_mapping import QuadMapPatternS, USER_SECTION
from .auth import User
from .generic import Content
from .discussion import Discussion

class Action(DiscussionBoundBase):
    """
    An action that can be taken by an actor.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    type = Column(String(255), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, VERSION.when)})

    __mapper_args__ = {
        'polymorphic_identity': 'action',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    actor_id = Column(
        Integer,
        ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VERSION.who)}
    )

    actor = relationship(
        User,
        backref=backref('actions', order_by=creation_date, cascade="all, delete-orphan")
    )

    verb = 'did something to'

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(None,
            RDF.type, IriClass(VirtRDF.QNAME_ID).apply(Action.type),
            name=QUADNAMES.class_Action_class)]

    def __repr__(self):

        return "<%s '%s'>" % (
            self.__class__.__name__,
            " ".join([
                self.actor.display_name() if self.actor else 'nobody',
                self.verb,
                self.object_type
            ])
        )


class ActionOnPost(Action):
    """
    An action that is taken on a post. (Mixin)
    """
    __tablename__ = 'action_on_post'
    id = Column(
        Integer,
        ForeignKey(Action.id, ondelete="CASCADE", onupdate='CASCADE'),
        primary_key=True
    )

    post_id = Column(
        Integer,
        ForeignKey('content.id', ondelete="CASCADE", onupdate='CASCADE'),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VERSION.what)}
    )

    post = relationship(
        'Content',
        backref=backref('actions', cascade="all, delete-orphan"),
    )

    object_type = 'post'

    def get_discussion_id(self):
        return self.post.get_discussion_id()

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(None,
            RDF.type, IriClass(VirtRDF.QNAME_ID).apply(Action.type),
            name=QUADNAMES.class_ActionOnPost_class)]

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .generic import Content
        return ((cls.id == Action.id),
                (cls.post_id == Content.id),
                (Content.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, secondary=Content.__table__, uselist=False,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})


class ViewPost(ActionOnPost):
    """
    A view action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ReadStatusChange'
    }

    def tombstone(self):
        from .generic import Content
        return DiscussionBoundTombstone(
            self, post=Content.uri_generic(self.post_id),
            actor=User.uri_generic(self.actor_id))

    post_from_view = relationship(
        'Content',
        backref=backref('views'),
    )

    verb = 'viewed'


class ExpandPost(ActionOnPost):
    """
    An expansion action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ExpandPost'
    }

    verb = 'expanded'


class CollapsePost(ActionOnPost):
    """
    A collapse action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:CollapsePost'
    }

    verb = 'collapsed'
