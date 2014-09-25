from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import (
    relationship, backref)
from sqlalchemy import (
    Column,
    Integer,
    String,
    UnicodeText,
    DateTime,
    ForeignKey,
)
from sqlalchemy.ext.associationproxy import association_proxy

from . import DiscussionBoundBase
from .discussion import Discussion
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..auth import (
    CrudPermissions, P_ADMIN_DISC, P_EDIT_SYNTHESIS)
from .idea import Idea, IdeaLink
from ..semantic.namespaces import (
    SIOC, CATALYST, IDEA, ASSEMBL, DCTERMS)
from assembl.views.traversal import AbstractCollectionDefinition


class defaultdictlist(defaultdict):
    def __init__(self):
        super(defaultdictlist, self).__init__(list)


class IdeaGraphView(DiscussionBoundBase):
    """
    A view on the graph of idea.
    """
    __tablename__ = "idea_graph_view"
    rdf_class = CATALYST.Map

    type = Column(String(60), nullable=False)
    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.created)})

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info = {'rdf': QuadMapPatternS(None, SIOC.has_container)}
    )
    discussion = relationship(Discussion, backref="views")

    __mapper_args__ = {
        'polymorphic_identity': 'idea_graph_view',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    def copy(self):
        retval = self.__class__()
        retval.discussion = self.discussion
        return retval

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    crud_permissions = CrudPermissions(P_ADMIN_DISC)


class SubGraphIdeaAssociation(DiscussionBoundBase):
    __tablename__ = 'sub_graph_idea_association'
    id = Column(Integer, primary_key=True)
    sub_graph_id = Column(Integer, ForeignKey(
        'explicit_sub_graph_view.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True, nullable=False)
    sub_graph = relationship("ExplicitSubGraphView", backref="idea_assocs")
    idea_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"), index=True)
    # reference to the "Idea" object for proxying
    idea = relationship("Idea")

    def __init__(self, idea=None, sub_graph=None, **kwargs):
        super(SubGraphIdeaAssociation, self).__init__(**kwargs)
        self.idea = idea
        self.sub_graph = sub_graph

    def get_discussion_id(self):
        if self.sub_graph:
            return self.sub_graph.get_discussion_id()
        else:
            return IdeaGraphView.get(id=self.sub_graph_id).get_discussion_id()

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        from . import ExplicitSubGraphView
        return (cls.sub_graph_id == IdeaGraphView.id) & \
            (IdeaGraphView.discussion_id == discussion_id)

    # @classmethod
    # def special_quad_patterns(cls, alias_manager):
    #     return [QuadMapPatternS(
    #         Idea.iri_class().apply(cls.source_id),
    #         IDEA.includes,
    #         Idea.iri_class().apply(cls.target_id),
    #         name=QUADNAMES.idea_inclusion_reln)]

    crud_permissions = CrudPermissions(P_ADMIN_DISC)

class SubGraphIdeaLinkAssociation(DiscussionBoundBase):
    __tablename__ = 'sub_graph_idea_link_association'
    id = Column(Integer, primary_key=True)

    sub_graph_id = Column(Integer, ForeignKey(
        'explicit_sub_graph_view.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True, nullable=False)
    sub_graph = relationship("ExplicitSubGraphView", backref="idealink_assocs")

    idea_link_id = Column(Integer, ForeignKey(
        'idea_idea_link.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True)

    # reference to the "IdeaLink" object for proxying
    idea_link = relationship("IdeaLink")

    def __init__(self, idea_link=None, sub_graph=None, **kwargs):
        super(SubGraphIdeaLinkAssociation, self).__init__(**kwargs)
        self.idea_link = idea_link
        self.sub_graph = sub_graph

    def get_discussion_id(self):
        if self.sub_graph:
            return self.sub_graph.get_discussion_id()
        else:
            return IdeaGraphView.get(id=self.sub_graph_id).get_discussion_id()

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        from . import ExplicitSubGraphView
        return (cls.sub_graph_id == IdeaGraphView.id) & \
            (IdeaGraphView.discussion_id == discussion_id)

    crud_permissions = CrudPermissions(P_ADMIN_DISC)

class ExplicitSubGraphView(IdeaGraphView):
    """
    A view where the Ideas and/or ideaLinks have been explicitly selected.

    Note that ideaLinks may point to ideas that are not in the graph.  They
    should be followed transitively (if their nature is compatible) to reach
    every idea in graph as if they were directly linked.
    """
    __tablename__ = "explicit_sub_graph_view"

    id = Column(Integer, ForeignKey(
        'idea_graph_view.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    ideas_associations = relationship(SubGraphIdeaAssociation,
                                      cascade="all, delete-orphan")

    # proxy the 'idea' attribute from the 'ideas_associations' relationship
    # for direct access
    ideas = association_proxy('ideas_associations', 'idea')

    idea_links_associations = relationship(SubGraphIdeaLinkAssociation,
                                           cascade="all, delete-orphan")

    # proxy the 'idea_link' attribute from the 'idea_links_associations'
    # relationship for direct access
    idea_links = association_proxy('idea_links_associations', 'idea_link')

    __mapper_args__ = {
        'polymorphic_identity': 'explicit_sub_graph_view',
    }

    def copy(self):
        retval = IdeaGraphView.copy(self)
        retval.ideas = self.ideas
        return retval

    @classmethod
    def extra_collections(cls):
        class IdeaCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(IdeaCollectionDefinition, self).__init__(cls, Idea)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                view = self.owner_alias
                return query.join(SubGraphIdeaAssociation, view)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        assocs.append(SubGraphIdeaAssociation(
                            idea=inst, sub_graph=parent_instance,
                            **self.filter_kwargs(
                                SubGraphIdeaAssociation, kwargs)))
                    elif isinstance(inst, IdeaLink):
                        assocs.append(SubGraphIdeaLinkAssociation(
                                idea_link=inst, sub_graph=parent_instance,
                                **self.filter_kwargs(
                                    SubGraphIdeaLinkAssociation, kwargs)))

            def contains(self, parent_instance, instance):
                return SubGraphIdeaAssociation.db.query(
                    SubGraphIdeaAssociation).filter_by(
                        idea=instance,
                        sub_graph=parent_instance
                    ).count() > 0

        class IdeaLinkCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(IdeaLinkCollectionDefinition, self).__init__(cls, IdeaLink)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                view = self.owner_alias
                return query.join(SubGraphIdeaLinkAssociation, view)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                if isinstance(instance, IdeaLink):
                    assocs.append(
                        SubGraphIdeaLinkAssociation(
                            idea_link=instance, sub_graph=parent_instance,
                            **self.filter_kwargs(
                                SubGraphIdeaLinkAssociation, kwargs)))

            def contains(self, parent_instance, instance):
                return SubGraphIdeaAssociation.db.query(
                    SubGraphIdeaLinkAssociation).filter_by(
                        idea_link=instance,
                        sub_graph=parent_instance
                    ).count() > 0

        return {'ideas': IdeaCollectionDefinition(cls),
                'idea_links': IdeaLinkCollectionDefinition(cls)}

    crud_permissions = CrudPermissions(P_ADMIN_DISC)

class TableOfContents(IdeaGraphView):
    """
    Represents a Table of Ideas.

    A ToI in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(Integer, ForeignKey(
        'idea_graph_view.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'table_of_contents',
    }

    discussion = relationship(
        Discussion, backref=backref("table_of_contents", uselist=False))

    def serializable(self):
        return {
            "@id": self.uri_generic(self.id),
            "@type": self.external_typename(),
            "topic": self.topic,
            "slug": self.slug,
            "table_of_contents_id":
            TableOfContents.uri_generic(self.table_of_contents_id),
            "synthesis_id":
            Synthesis.uri_generic(self.synthesis_id)
        }

    def get_discussion_id(self):
        return self.discussion.id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    def get_idea_links(self):
        return self.discussion.get_idea_links()

    def get_ideas(self):
        return self.discussion.ideas

    def __repr__(self):
        return "<TableOfContents %s>" % repr(self.discussion.topic)


class Synthesis(ExplicitSubGraphView):
    """
    A synthesis of the discussion.  A selection of ideas, associated with
    comments, sent periodically to the discussion.

    A synthesis only has link's to ideas before publication (as it is edited)
    Once published, if freezes the links by copying tombstoned versions of
    each link in the discussion.
    """
    __tablename__ = "synthesis"

    id = Column(Integer, ForeignKey(
        'explicit_sub_graph_view.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    subject = Column(UnicodeText)
    introduction = Column(UnicodeText)
    conclusion = Column(UnicodeText)

    __mapper_args__ = {
        'polymorphic_identity': 'synthesis',
    }

    def copy(self):
        retval = ExplicitSubGraphView.copy(self)
        retval.subject = self.subject
        retval.introduction = self.introduction
        retval.conclusion = self.conclusion
        return retval

    def publish(self):
        """ Publication is the end of a synthesis's lifecycle.
        It creates a new next_synthesis, copied from this one.
        Return's the new discussion next_synthesis """
        next_synthesis = self.copy()
        self.db.add(next_synthesis)

        #Copy tombstoned versions of all idea links in the current discussion
        links = Idea.get_all_idea_links(self.discussion_id)
        for link in links:
            new_link = link.copy()
            new_link.is_tombstone = True
            self.idea_links.append(new_link)
        self.db.add(self)
        return next_synthesis

    @property
    def is_next_synthesis(self):
        return self.discussion.get_next_synthesis() == self;

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    def __repr__(self):
        return "<Synthesis %s>" % repr(self.subject)

    crud_permissions = CrudPermissions(P_EDIT_SYNTHESIS)

