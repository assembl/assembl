from datetime import datetime
import re
import quopri
from itertools import groupby, chain
import traceback
import anyjson as json

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select, text
from pyramid.security import Allow, ALL_PERMISSIONS
from pyramid.i18n import TranslationString as _

from sqlalchemy import (
    Table,
    Column,
    Boolean,
    Integer,
    String,
    Float,
    Unicode,
    UnicodeText,
    DateTime,
    ForeignKey,
    desc,
    event,
    and_,
)
from sqlalchemy.ext.associationproxy import association_proxy

from assembl.lib.utils import slugify

from ..lib.sqla import db_schema, Base as SQLAlchemyBaseModel

from ..source.models import (ContentSource, PostSource, Content, Post, Mailbox)
from ..auth.models import (
    DiscussionPermission, Role, Permission, AgentProfile, User,
    UserRole, LocalUserRole, DiscussionPermission, P_READ,
    R_SYSADMIN, ViewPost)
from assembl.auth import get_permissions


class Discussion(SQLAlchemyBaseModel):
    """
    A Discussion
    """
    __tablename__ = "discussion"

    id = Column(Integer, primary_key=True)

    topic = Column(UnicodeText, nullable=False)

    slug = Column(Unicode, nullable=False, unique=True, index=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    

    

    def read_post_ids(self, user_id):
        return (x[0] for x in self.db.query(Post.id).join(
            ViewPost
        ).filter(
            Post.discussion_id == self.id,
            ViewPost.actor_id == user_id,
            ViewPost.post_id == Post.id
        ))

    def get_read_posts_ids_preload(self, user_id):
        return json.dumps([
            Post.uri_generic(id) for id in self.read_post_ids(user_id)])

    def import_from_sources(self, only_new=True):
        for source in self.sources:
            # refetch after calling
            source = PostSource.db.merge(source)
            try:
                source.import_content(only_new=only_new)
            except:
                traceback.print_exc()

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        self.db.add(self)
        self.db.flush()
        self.root_idea = RootIdea(discussion_id=self.id)
        table_of_contents = TableOfContents(discussion=self)
        synthesis = Synthesis(discussion=self)
        self.db.add(table_of_contents)
        self.db.add(synthesis)

    def serializable(self):
        return {
            "@id": self.uri(),
            "@type": self.external_typename(),
            "topic": self.topic,
            "slug": self.slug,
            "creation_date": self.creation_date.isoformat(),
            "root_idea": self.root_idea.uri()
        }

    def get_discussion_id(self):
        return self.id

    def get_next_synthesis(self):
        next_synthesis = self.db().query(Synthesis).filter(
            and_(Synthesis.discussion_id == self.id,
                 Synthesis.published_in_post == None)
        ).all()
        #There should only be a single next synthesis
        assert len(next_synthesis) == 1
        return next_synthesis[0]

    def get_last_published_synthesis(self):
        return self.db().query(Synthesis).filter(
            Synthesis.discussion_id == self.id and
            Synthesis.published_in_post != None
        ).order_by(Synthesis.published_in_post.creation_date.desc()
                   ).first()

    def get_permissions_by_role(self):
        roleperms = self.db().query(Role.name, Permission.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        roleperms.sort()
        byrole = groupby(roleperms, lambda (r, p): r)
        return {r: [p for (r2, p) in rps] for (r, rps) in byrole}

    def get_roles_by_permission(self):
        permroles = self.db().query(Permission.name, Role.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        permroles.sort()
        byperm = groupby(permroles, lambda (p, r): p)
        return {p: [r for (p2, r) in prs] for (p, prs) in byperm}

    def get_readers(self):
        users = self.db().query(User).join(
            UserRole, Role, DiscussionPermission, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ
            ).union(self.db().query(User).join(
                LocalUserRole, Role, DiscussionPermission, Permission).filter(
                    DiscussionPermission.discussion_id == self.id and
                    LocalUserRole.discussion_id == self.id and
                    Permission.name == P_READ)).all()
        if session.query(DiscussionPermission).join(
            Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ and
                Role.name == Authenticated).first():
            pass  # add a pseudo-authenticated user???
        if session.query(DiscussionPermission).join(
            Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ and
                Role.name == Everyone).first():
            pass  # add a pseudo-anonymous user?
        return users

    def get_all_agents(self):
        return self.db().query(AgentProfile).all()

    def get_all_agents_preload(self):
        return json.dumps([ap.serializable() for ap in self.get_all_agents()])

    def get_readers_preload(self):
        return json.dumps([user.serializable() for user in self.get_readers()])

    def get_ideas_preload(self):
        return json.dumps([idea.serializable() for idea in self.ideas])

    def get_related_extracts(self):
        return self.extracts

    def get_related_extracts_preload(self):
        return json.dumps(
            [e.serializable() for e in self.get_related_extracts()])

    def get_user_permissions(self, user_id):
        return get_permissions(user_id, self.id)

    def get_user_permissions_preload(self, user_id):
        return json.dumps(self.get_user_permissions(user_id))

    # Properties as a route context
    __parent__ = None

    @property
    def __name__(self):
        return self.slug

    @property
    def __acl__(self):
        acls = [(Allow, dp.role.name, dp.permission.name) for dp in self.acls]
        acls.append((Allow, R_SYSADMIN, ALL_PERMISSIONS))
        return acls

    def __repr__(self):
        return "<Discussion %s>" % repr(self.topic)


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)


class IdeaGraphView(SQLAlchemyBaseModel):
    """
    A view on the graph of idea.
    """
    __tablename__ = "idea_graph_view"

    type = Column(String(60), nullable=False)
    id = Column(Integer, primary_key=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    discussion = relationship('Discussion')

    __mapper_args__ = {
        'polymorphic_identity': 'idea_graph_view',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    def copy(self):
        retval = self.__class__()
        retval.discussion = self.discussion
        return retval


class SubGraphIdeaAssociation(SQLAlchemyBaseModel):
    __tablename__ = 'sub_graph_idea_association'
    id = Column(Integer, primary_key=True)
    sub_graph_id = Column(Integer, ForeignKey(
        'explicit_sub_graph_view.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True)
    sub_graph = relationship("ExplicitSubGraphView")
    idea_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"), index=True)
    # reference to the "Idea" object for proxying
    idea = relationship("Idea")

    def __init__(self, idea=None, sub_graph=None):
        self.idea = idea
        self.sub_graph = sub_graph


class SubGraphIdeaLinkAssociation(SQLAlchemyBaseModel):
    __tablename__ = 'sub_graph_idea_link_association'
    id = Column(Integer, primary_key=True)

    sub_graph_id = Column(Integer, ForeignKey(
        'explicit_sub_graph_view.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True)

    idea_link_id = Column(Integer, ForeignKey(
        'idea_idea_link.id', ondelete="CASCADE", onupdate="CASCADE"),
        index=True)

    # reference to the "IdeaLink" object for proxying
    idea_link = relationship("IdeaLink")

    def __init__(self, idea_link=None, sub_graph=None):
        self.idea_link = idea_link
        self.sub_graph = sub_graph


class ExplicitSubGraphView(IdeaGraphView):
    """
    A view where the Ideas and/or ideaLinks have been explicitly selected.

    Note that ideaLinks may point to ideas that are not in the graph.  They
    should be followed transitively (if their nature is compatible) to reach
    every idea in graph as if the were directly linked.
    """
    __tablename__ = "explicit_sub_graph_view"

    id = Column(Integer, ForeignKey(
        'idea_graph_view.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    ideas_associations = relationship(SubGraphIdeaAssociation)

    # proxy the 'idea' attribute from the 'ideas_associations' relationship
    # for direct access
    ideas = association_proxy('ideas_associations', 'idea')

    idea_links_associations = relationship(SubGraphIdeaLinkAssociation)

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

    def get_idea_links(self):
        return Idea.get_all_idea_links(self.id)

    def get_idea_and_links(self):
        return chain(self.ideas, self.get_idea_links())

    def get_top_ideas(self):
        return self.db().query(Idea).filter(
            Idea.discussion_id == self.discussion_id).filter(
                ~Idea.source_links.any()).all()

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

    def serializable(self):
        return {
            "@id": self.uri_generic(self.id),
            "@type": self.external_typename(),
            "creation_date": self.creation_date.isoformat(),
            "subject": self.subject,
            "introduction": self.introduction,
            "conclusion": self.conclusion,
            "discussion_id": Discussion.uri_generic(self.discussion.id),
        }

    def get_discussion_id(self):
        return self.discussion_id

    def __repr__(self):
        return "<Synthesis %s>" % repr(self.subject)


class IdeaLink(SQLAlchemyBaseModel):
    """
    A generic link between two ideas
    
    If a parent-child relation, the parent is the source, the child the target
    """
    __tablename__ = 'idea_idea_link'
    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    target_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    source = relationship(
        'Idea', backref='target_links',
        foreign_keys=(source_id))
    target = relationship(
        'Idea', backref='source_links',
        foreign_keys=(target_id))
    order = Column(Float, nullable=False, default=0.0)
    is_tombstone = Column(Boolean, nullable=False, default=False, index=True)

    def copy(self):
        retval = self.__class__(source_id=self.source_id,
                                target_id=self.target_id,
                                is_tombstone=self.is_tombstone
                                )
        self.db.add(retval)
        return retval


class Idea(SQLAlchemyBaseModel):
    """
    A core concept taken from the associated discussion
    """
    __tablename__ = "idea"
    ORPHAN_POSTS_IDEA_ID = 'orphan_posts'
    sqla_type = Column(String(60), nullable=False)
    
    long_title = Column(UnicodeText)
    short_title = Column(UnicodeText)
    definition = Column(UnicodeText)

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'),
        nullable=False,
        index=True,)

    discussion = relationship(
        "Discussion",
        backref=backref('ideas', order_by=creation_date)
    )
    
    __mapper_args__ = {
        'polymorphic_identity': 'idea',
        'polymorphic_on': sqla_type,
        # Not worth it for now, as the only other class is RootIdea, and there
        # is only one per discussion - benoitg 2013-12-23
        #'with_polymorphic': '*'
    }


    @property
    def children(self):
        return [cl.target for cl in self.target_links]

    @property
    def parents(self):
        return [cl.source for cl in self.source_links]
    
    def get_order_from_first_parent(self):
        return self.source_links[0].order if self.source_links else None
    
    def get_first_parent_uri(self):
        return Idea.uri_generic(self.source_links[0].source_id
            ) if self.source_links else None
            
    def serializable(self):
        return {
            '@id': self.uri_generic(self.id),
            '@type': self.external_typename(),
            'shortTitle': self.short_title,
            'longTitle': self.long_title,
            'creationDate': self.creation_date.isoformat(),
            'order': self.get_order_from_first_parent(),
            'active': False,
            'featured': False,
            'parentId': self.get_first_parent_uri(),
            'inNextSynthesis': self.is_in_next_synthesis(),
            'numChildIdea': self.get_num_children(),
            'num_posts': self.num_posts,
        }

    @staticmethod
    def _get_idea_dag_statement(skip_where=False):
        retval = """
WITH    RECURSIVE
idea_dag(idea_id, source_id, idea_depth, idea_path, idea_cycle) AS
(
SELECT  idea_initial.id as idea_id, source_id, 1, ARRAY[idea_initial.id], false
FROM    idea AS idea_initial LEFT JOIN idea_idea_link ON (
idea_initial.id = idea_idea_link.target_id
AND idea_idea_link.is_tombstone=FALSE
)
"""
        if(not skip_where):
            retval = retval + """
WHERE idea_initial.id=:root_idea_id
"""
        retval = retval + """
UNION ALL
SELECT idea.id as idea_id, idea_idea_link.source_id, idea_dag.idea_depth + 1,
       idea_path || idea.id, idea.id = ANY(idea_path)
FROM (
    idea_dag JOIN idea_idea_link ON (
    idea_dag.idea_id = idea_idea_link.source_id
    AND idea_idea_link.is_tombstone=FALSE
    ) JOIN idea ON (idea.id = idea_idea_link.target_id)
)
)
"""
        return retval

    @staticmethod
    def _get_related_posts_statement_no_select(select, skip_where):
        return Idea._get_idea_dag_statement(skip_where) + select + """
FROM idea_dag
JOIN idea_content_link ON (idea_content_link.idea_id = idea_dag.idea_id)
JOIN idea_content_positive_link
    ON (idea_content_positive_link.id = idea_content_link.id)
JOIN post AS root_posts ON (idea_content_link.content_id = root_posts.id)
JOIN post ON (
    (post.ancestry != ''
    AND post.ancestry LIKE root_posts.ancestry || root_posts.id || ',' || '%'
    )
    OR post.id = root_posts.id
)
"""

    @staticmethod
    def _get_related_posts_statement(skip_where=False):
        return Idea._get_related_posts_statement_no_select(
            "SELECT DISTINCT post.id", skip_where)

    @staticmethod
    def _get_count_related_posts_statement():
        return Idea._get_related_posts_statement_no_select(
            "SELECT COUNT(DISTINCT post.id) as total_count", False)

    @staticmethod
    def _get_orphan_posts_statement_no_select(select):
        """ Requires discussion_id bind parameters """
        return select + """
FROM post
JOIN content ON (
    content.id = post.id
    AND content.discussion_id = :discussion_id
)
WHERE post.id NOT IN (
""" + Idea._get_related_posts_statement(True) + """
)
"""

    @staticmethod
    def _get_count_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select(
            "SELECT COUNT(post.id) as total_count")

    @staticmethod
    def _get_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select("SELECT post.id")

    @property
    def num_posts(self):
        """ This is extremely naive and slow, but as this is all temp code
        until we move to a graph database, it will probably do for now """
        result = self.db.execute(text(
            Idea._get_count_related_posts_statement()),
            {"root_idea_id": self.id})
        return result.first()['total_count']

    def get_discussion_id(self):
        return self.discussion_id

    def get_num_children(self):
        return len(self.children)

    def is_in_next_synthesis(self):
        next_synthesis = self.discussion.get_next_synthesis()
        return True if self in next_synthesis.ideas else False

    def __repr__(self):
        if self.short_title:
            return "<Idea %d %s>" % (self.id, repr(self.short_title))

        return "<Idea %d>" % self.id

    @classmethod
    def get_all_idea_links(cls, discussion_id):
        target = aliased(cls)
        source = aliased(cls)
        return cls.db().query(
            IdeaLink).join(
                source, source.id == IdeaLink.source_id).join(
                    target, target.id == IdeaLink.target_id).filter(
                        target.discussion_id == discussion_id).filter(
                            source.discussion_id == discussion_id).filter(
                                IdeaLink.is_tombstone is False).all()

class RootIdea(Idea):
    """
    The root idea.  It represents the discussion.
    
    If has implicit links to all content and posts in the discussion.
    """
    __tablename__ = "root_idea"

    id = Column(Integer, ForeignKey(
        'idea.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)
    
    root_for_discussion = relationship('Discussion',
        backref=backref('root_idea', uselist=False),
        )
    
    __mapper_args__ = {
        'polymorphic_identity': 'root_idea',
    }

    @property
    def num_posts(self):
        """ In the root idea, this is the count of all mesages in the system """
        result = self.db.query(Post).filter(
            Post.discussion_id == self.discussion_id
            ).count()
        return result
    
    def get_num_orphan_posts(self):
        "The number of posts unrelated to any idea in the current discussion"
        result = self.db.execute(text(
            Idea._get_count_orphan_posts_statement()).params(
                discussion_id=self.discussion_id))
        return result.first()['total_count']

    @staticmethod
    def serializable_unsorted_posts_pseudo_idea(discussion):
        """
        Returns a "fake" idea linking the posts unreacheable by navigating
        post threads linked to any other idea
        """
        return {
            '@id': Idea.ORPHAN_POSTS_IDEA_ID,
            '@type': Idea.external_typename(),
            'shortTitle': _('Unsorted posts'),
            'longTitle': '',
            'creationDate': None,
            'order': 1000000000,
            'active': False,
            'featured': False,
            'parentId': None,
            'inNextSynthesis': False,
            'total': 0,
            'num_posts': discussion.root_idea.get_num_orphan_posts(),
        }

class IdeaContentLink(SQLAlchemyBaseModel):
    """
    Abstract class representing a generic link between an idea and a Content
    (typically a Post)
    """
    __tablename__ = 'idea_content_link'
    id = Column(Integer, primary_key=True)
    type = Column(String(60))

    # This is nullable, because in the case of extracts, the idea can be
    # attached later.
    idea_id = Column(Integer, ForeignKey('idea.id'),
                     nullable=True, index=True)
    idea = relationship('Idea')

    content_id = Column(Integer, ForeignKey(
        'content.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    content = relationship(Content)

    order = Column(Float, nullable=False, default=0.0)
    
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    creator_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    creator = relationship(
        'AgentProfile', foreign_keys=[creator_id], backref='extracts_created')

    __mapper_args__ = {
        'polymorphic_identity': 'idea_content_link',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }


class IdeaContentPositiveLink(IdeaContentLink):
    """
    A normal link between an idea and a Content.
    Such links should be traversed.
    """
    __tablename__ = 'idea_content_positive_link'

    id = Column(Integer, ForeignKey(
        'idea_content_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_content_positive_link',
    }


class IdeaRelatedPostLink(IdeaContentPositiveLink):
    """
    A post that is relevant, as a whole, to an idea, without having a specific
    extract harvested.
    """
    __tablename__ = 'idea_related_post_link'

    id = Column(Integer, ForeignKey(
        'idea_content_positive_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_related_post_link',
    }


class Extract(IdeaContentPositiveLink):
    """
    An extracted part of a Content. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'

    id = Column(Integer, ForeignKey(
        'idea_content_positive_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    body = Column(UnicodeText, nullable=False)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    discussion = relationship('Discussion', backref='extracts')

    annotation_text = Column(UnicodeText)

    owner_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    owner = relationship(
        'AgentProfile', foreign_keys=[owner_id], backref='extracts_owned')

    extract_source = relationship(Content, backref="extracts")
    extract_ideas = relationship(Idea, backref="extracts")

    __mapper_args__ = {
        'polymorphic_identity': 'extract',
    }

    def serializable(self):
        json = {
            '@id': self.uri_generic(self.id),
            '@type': self.external_typename(),
            'annotator_schema_version': 'v1.0',
            'quote': self.body,
            'ranges': [tfi.__json__() for tfi
                       in self.text_fragment_identifiers],
            'target': {
                '@type': self.content.external_typename()
            },
            'created': self.creation_date.isoformat(),
            'idCreator': AgentProfile.uri_generic(self.creator_id),
            #'user': self.creator.get_uri(),
            'text': self.annotation_text,
        }
        if self.idea_id:
            json['idIdea'] = Idea.uri_generic(self.idea_id)
            #json['text'] += '<a href="%s">%s</a>' % (
            #   self.idea.get_uri(), self.idea.short_title)
        if isinstance(self.content, Post):
            json['target']['@id'] = Post.uri_generic(self.content.id)
            json['idPost'] = Post.uri_generic(self.content.id)  # legacy
            #json['url'] = self.post.get_uri()
        elif self.content.type == 'webpage':
            json['target']['url'] = self.content.url
            json['uri'] = self.content.url
            json['text'] = "Cf " + self.content.source.discussion.topic
        return json

    def __repr__(self):
        return "<Extract %d %s>" % (self.id, repr(self.body[:20]))

    def get_target(self):
        return self.content

    def get_post(self):
        if isinstance(self.content, Post):
            return self.content

    def infer_text_fragment(self):
        return self._infer_text_fragment_inner(
            self.content.get_title(), self.content.get_body(),
            self.get_post().id)

    def _infer_text_fragment_inner(self, title, body, post_id):
        body = Mailbox.sanitize_html(body, [])
        quote = self.body.replace("\r", "")
        try:
            # for historical reasons
            quote = quopri.decodestring(quote)
        except:
            pass
        quote = Mailbox.sanitize_html(quote, [])
        if quote != self.body:
            self.body = quote
        quote = quote.replace("\n", "")
        start = body.find(quote)
        lookin = 'message-body'
        if start < 0:
            xpath = "//div[@id='%s']/div[class='post_title']" % (post_id)
            start = title.find(quote)
            if start < 0:
                return None
            lookin = 'message-subject'
        xpath = "//div[@id='message-%s']//div[@class='%s']" % (
            Post.uri_generic(post_id), lookin)
        tfi = self.db.query(TextFragmentIdentifier).filter_by(
            extract=self).first()
        if not tfi:
            tfi = TextFragmentIdentifier(extract=self)
        tfi.xpath_start = tfi.xpath_end = xpath
        tfi.offset_start = start
        tfi.offset_end = start+len(quote)
        return tfi

    def get_discussion_id(self):
        return self.discussion_id


class IdeaContentNegativeLink(IdeaContentLink):
    """
    A negative link between an idea and a Content.  Such links mean that
    a transitive context should be considered broken.  Used for thread breaking
    """
    __tablename__ = 'idea_content_negative_link'

    id = Column(Integer, ForeignKey(
        'idea_content_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_content_negative_link',
    }


class IdeaThreadContextBreakLink(IdeaContentNegativeLink):
    """
    Used for a Post the inherits an Idea from an ancester in the thread.
    It indicates that from this point on in the thread, this idea is no longer
    discussed.
    """
    __tablename__ = 'idea_thread_context_break_link'

    id = Column(Integer, ForeignKey(
        'idea_content_negative_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_thread_context_break_link',
    }


class TextFragmentIdentifier(SQLAlchemyBaseModel):
    __tablename__ = 'text_fragment_identifier'
    id = Column(Integer, primary_key=True)
    extract_id = Column(Integer, ForeignKey(
        Extract.id, ondelete="CASCADE"), index=True)
    xpath_start = Column(String)
    offset_start = Column(Integer)
    xpath_end = Column(String)
    offset_end = Column(Integer)
    extract = relationship(Extract, backref='text_fragment_identifiers')

    xpath_re = re.compile(
        r'xpointer\(start-point\(string-range\(([^,]+),([^,]+),([^,]+)\)\)'
        r'/range-to\(string-range\(([^,]+),([^,]+),([^,]+)\)\)\)')

    def __string__(self):
        return ("xpointer(start-point(string-range(%s,'',%d))/"
                "range-to(string-range(%s,'',%d)))" % (
                self.xpath_start, self.offset_start,
                self.xpath_end, self.offset_end))

    def __json__(self):
        return {"start": self.xpath_start, "startOffset": self.offset_start,
                "end": self.xpath_end, "endOffset": self.offset_end}

    @classmethod
    def from_xpointer(cls, extract_id, xpointer):
        m = xpath_re.match(xpointer)
        if m:
            try:
                (xpath_start, start_text, offset_start,
                    xpath_end, end_text, offset_end) = m.groups()
                offset_start = int(offset_start)
                offset_end = int(end_offset)
                xpath_start = xpath_start.strip()
                assert xpath_start[0] in "\"'"
                xpath_start = xpath_start.strip(xpath_start[0])
                xpath_end = xpath_end.strip()
                assert xpath_end[0] in "\"'"
                xpath_end = xpath_end.strip(xpath_end[0])
                return TextFragmentIdentifier(
                    extract_id=extract_id,
                    xpath_start=xpath_start, offset_start=offset_start,
                    xpath_end=xpath_end, offset_end=offset_end)
            except:
                pass
        return None

    def get_discussion_id(self):
        if self.extract:
            return self.extract.get_discussion_id()
        elif self.extract_id:
            return Extract.get(id=extract_id).get_discussion_id()
