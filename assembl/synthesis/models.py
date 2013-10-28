from datetime import datetime
import re

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select, text
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
)

from assembl.lib.utils import slugify

from ..lib.sqla import Base as SQLAlchemyBaseModel
from ..source.models import (Source, Content, Post)

class Discussion(SQLAlchemyBaseModel):
    """
    A Discussion
    """
    __tablename__ = "discussion"

    id = Column(Integer, primary_key=True)

    topic = Column(UnicodeText, nullable=False)
    
    slug = Column(UnicodeText, nullable=False, unique=True, index=True)
    
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    table_of_contents_id = Column(
        Integer,
        ForeignKey('table_of_contents.id', ondelete="CASCADE"),
        nullable=False,
    )

    table_of_contents = relationship(
        'TableOfContents', 
        uselist=False,
    )

    synthesis = relationship('Synthesis', uselist=False)

    owner_id = Column(
        Integer,
        ForeignKey('user.id'),
        nullable=False
    )

    owner = relationship(
        'User',
        backref="discussions"
    )

    def posts(self, parent_id=None):
        """
        Returns an iterable query of posts whose content comes from a source
        that belongs to this discussion. The result is a list of posts sorted
        by their youngest descendent in descending order.
        """
        lower_post = aliased(Post, name="lower_post")
        lower_content = aliased(Content, name="lower_content")
        upper_post = aliased(Post, name="upper_post")
        upper_content = aliased(Content, name="upper_content")

        latest_update = select([
            func.coalesce(
                func.max(lower_content.creation_date),
                upper_content.creation_date
            )
        ], lower_post.content_id==lower_content.id).where(
            lower_post.ancestry.like(
                upper_post.ancestry + cast(upper_post.id, String) + ',%'
            )
        ).label("latest_update")

        query = self.db.query(
            upper_post,
        ).join(
            upper_content,
        ).filter(
            upper_post.parent_id==parent_id
        ).order_by(
            desc(latest_update)
        )

        if not parent_id:
            query = query.join(
                Source
            ).filter(
                Source.discussion_id==self.id,
                upper_content.source_id==Source.id,
            )

        return query

    def total_posts(self):
        return self.db.query(Post).join(
            Content,
            Source
        ).filter(
            Source.discussion_id==self.id,
            Content.source_id==Source.id,
        ).count()

    def import_from_sources(self, only_new=True):
        for source in self.sources:
            source.import_content(only_new=only_new)

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        self.table_of_contents = TableOfContents(discussion=self)
        self.synthesis = Synthesis(discussion=self)

    def serializable(self):
        return {
            "id": self.id, 
            "topic": self.topic,
            "slug": self.slug,
            "creation_date": self.creation_date.isoformat(),
            "table_of_contents_id": self.table_of_contents_id,
            "synthesis_id": self.synthesis.id,
            "owner_id": self.owner_id,
        }

    def __repr__(self):
        return "<Discussion %s>" % repr(self.topic)


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)


class TableOfContents(SQLAlchemyBaseModel):
    """
    Represents a Table of Contents.

    A ToC in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion = relationship(
        'Discussion',
        uselist=False
    )

    def serializable(self):
        return {
            "topic": self.topic,
            "slug": self.slug,
            "id": self.id,
            "table_of_contents_id": self.table_of_contents_id,
            "synthesis_id": self.synthesis_id
        }

    def __repr__(self):
        return "<TableOfContents %s>" % repr(self.discussion.topic)


class Synthesis(SQLAlchemyBaseModel):
    """
    A synthesis of the discussion.
    """
    __tablename__ = "synthesis"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    publication_date = Column(DateTime, default=datetime.now)

    subject = Column(UnicodeText)
    introduction = Column(UnicodeText)
    conclusion = Column(UnicodeText)

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id', ondelete="CASCADE"),
        nullable=False
    )

    discussion = relationship('Discussion')

    def serializable(self):
        return {
            "id": self.id,
            "creation_date": self.creation_date.isoformat(),
            "publication_date": self.publication_date.isoformat() \
                if self.publication_date \
                else None,
            "subject": self.subject,
            "introduction": self.introduction,
            "conclusion": self.conclusion,
            "discussion_id": self.discussion.id,
        }

    def __repr__(self):
        return "<Synthesis %s>" % repr(self.subject)


idea_association_table = Table(
    'idea_association',
    SQLAlchemyBaseModel.metadata,
    Column('parent_id', Integer, ForeignKey('idea.id')),
    Column('child_id', Integer, ForeignKey('idea.id')),
)

class Idea(SQLAlchemyBaseModel):
    """
    A core concept taken from the associated discussion
    """
    __tablename__ = "idea"
    ORPHAN_POSTS_IDEA_ID = 'orphan_posts'

    long_title = Column(UnicodeText)
    short_title = Column(UnicodeText)

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    order = Column(Float, nullable=False, default=0.0)

    table_of_contents_id = Column(
        Integer,
        ForeignKey('table_of_contents.id'),
        nullable=False
    )

    table_of_contents = relationship(
        'TableOfContents',
        backref='ideas',
    )

    children = relationship(
        "Idea",
        secondary='idea_association',
        backref="parents",
        primaryjoin=id==idea_association_table.c.parent_id,
        secondaryjoin=id==idea_association_table.c.child_id,
    )

    synthesis_id = Column(
        Integer,
        ForeignKey('synthesis.id'),
    )

    synthesis = relationship('Synthesis', backref='ideas')

    def serializable(self):
        return {
            'id': self.id,
            'shortTitle': self.short_title,
            'longTitle': self.long_title,
            'creationDate': self.creation_date.isoformat(),
            'order': self.order,
            'active': False,
            'featured': False,
            'parentId': self.parents[0].id if self.parents else None,
            'inSynthesis': True if self.synthesis_id else False,
            'total': len(self.children),
            'num_posts': self.num_posts,
        }
    @staticmethod
    def serializable_unsorded_posts_pseudo_idea(discussion):
        """
        Returns a "fake" idea linking the posts unreacheable by navigating
        post threads linked to any other idea
        """
        return {
            'id': Idea.ORPHAN_POSTS_IDEA_ID,
            'shortTitle': _('Unsorted posts'),
            'longTitle': '',
            'creationDate': None,
            'order': 1000000000,
            'active': False,
            'featured': False,
            'parentId': None,
            'inSynthesis': False,
            'total': 0,
            'num_posts': Idea.get_num_orphan_posts(discussion),
        }
    @staticmethod
    def _get_idea_dag_statement(skip_where=False):
        retval = """
WITH    RECURSIVE
idea_dag(idea_id, parent_id, idea_depth, idea_path, idea_cycle) AS
(
SELECT  id as idea_id, parent_id, 1, ARRAY[idea_initial.id], false 
FROM    idea AS idea_initial LEFT JOIN idea_association ON (idea_initial.id = idea_association.child_id) 
"""
        if(not skip_where):
            retval = retval + """
WHERE id=:root_idea_id
"""
        retval = retval + """
UNION ALL
SELECT idea.id as idea_id, idea_association.parent_id, idea_dag.idea_depth + 1, idea_path || idea.id, idea.id = ANY(idea_path)
FROM    (idea_dag JOIN idea_association ON (idea_dag.idea_id = idea_association.parent_id) JOIN idea ON (idea.id = idea_association.child_id)) 
)
"""
        return retval

    @staticmethod
    def _get_related_posts_statement_no_select(select, skip_where):
        return Idea._get_idea_dag_statement(skip_where) + select + """
FROM idea_dag 
JOIN extract ON (extract.idea_id = idea_dag.idea_id) 
JOIN content ON (extract.source_id = content.id) 
JOIN post AS root_posts ON (root_posts.content_id = content.id)
JOIN post ON (
    (post.ancestry != '' 
    AND post.ancestry LIKE root_posts.ancestry || root_posts.id || ',' || '%'
    )
    OR post.id = root_posts.id
)
"""
    @staticmethod
    def _get_related_posts_statement(skip_where=False):
        return Idea._get_related_posts_statement_no_select("SELECT DISTINCT post.id", skip_where)

    @staticmethod
    def _get_count_related_posts_statement():
        return Idea._get_related_posts_statement_no_select("SELECT COUNT(DISTINCT post.id) as total_count", False)

    @staticmethod
    def _get_orphan_posts_statement_no_select(select):
        """ Requires discussion_id bind parameters """
        return select + """
FROM post
JOIN content ON (post.content_id = content.id)
JOIN source ON (content.source_id = source.id)
JOIN discussion ON (source.discussion_id = discussion.id)
WHERE post.id NOT IN (
""" + Idea._get_related_posts_statement(True) + """
)
AND discussion.id=:discussion_id
"""

    @staticmethod
    def _get_count_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select("SELECT COUNT(post.id) as total_count")
 
    @staticmethod
    def _get_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select("SELECT post.id")
    
    @property
    def num_posts(self):
        """ This is extremely naive and slow, but as this is all temp code 
        until we move to a graph database, it will probably do for now """ 
        result = self.db.execute(text(Idea._get_count_related_posts_statement()),
                                   {"root_idea_id":self.id})
        return result.first()['total_count']

    @staticmethod
    def get_num_orphan_posts(discussion):
        """ The number of posts unrelated to any idea in the current discussion """ 
        result = Idea.db.execute(text(Idea._get_count_orphan_posts_statement()) \
                                   .params(discussion_id=discussion.id))
        return result.first()['total_count']

    def __repr__(self):
        if self.short_title:
            return "<Idea %d %s>" % (self.id, repr(self.short_title))

        return "<Idea %d>" % self.id


class Extract(SQLAlchemyBaseModel):
    """
    An extracted part. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    order = Column(Float, nullable=False, default=0.0)
    body = Column(UnicodeText, nullable=False)

    source_id = Column(Integer, ForeignKey('content.id'), nullable=False)
    source = relationship(Content, backref='extracts')

    idea_id = Column(Integer, ForeignKey('idea.id'), nullable=True)
    idea = relationship('Idea', backref='extracts')

    annotation_text = Column(UnicodeText)

    creator_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    creator = relationship(
        'AgentProfile', foreign_keys=[creator_id], backref='extracts_created')

    owner_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    owner = relationship(
        'AgentProfile', foreign_keys=[owner_id], backref='extracts_owned')

    def serializable(self):
        json = {
            'id': self.id,
            'annotator_schema_version': 'v1.0',
            'quote': self.body,
            'ranges': [tfi.__json__() for tfi 
                       in self.text_fragment_identifiers],
            'target': {
                '@type': self.source.type
            },
            'created': self.creation_date.isoformat(),
            'user': self.creator.serializable(), #TODO: Use username or id.
            'text': self.annotation_text,
            'source_creator': self.source.post.creator.serializable()
        }
        if self.idea_id:
            json['idIdea'] = self.idea_id
            #json['text'] += '<a href="%s">%s</a>' % (
            #   self.idea.get_uri(), self.idea.short_title)
        if self.source.type == 'email':
            json['target']['@id'] = self.source.post.id
            #json['url'] = self.source.post.get_uri()
        elif self.source.type == 'webpage':
            json['target']['url'] = self.source.url
            json['url'] = self.source.url
        return json

    def __repr__(self):
        return "<Extract %d %s>" % (self.id, repr(self.body[:20]))

    def infer_text_fragment(self):
        text = self.source.get_body()
        start = text.find(self.body)
        lookin = 'message-body'
        if start < 0:
            xpath = "//div[@id='%s']/div[class='post_title']"
            text = self.source.get_title()
            start = text.find(self.body)
            if start < 0:
                return None
            lookin = 'message-subject'
        xpath = "//div[@data-message-id='%d']//span[@class='%s']" % (
            self.source.post.id, lookin)
        return TextFragmentIdentifier(
            extract=self, xpath_start=xpath, offset_start=start,
            xpath_end=xpath, offset_end=start+len(self.body))


class TextFragmentIdentifier(SQLAlchemyBaseModel):
    __tablename__ = 'text_fragment_identifier'
    id = Column(Integer, primary_key=True)
    extract_id = Column(Integer, ForeignKey(Extract.id))
    xpath_start = Column(String)
    offset_start = Column(Integer)
    xpath_end = Column(String)
    offset_end = Column(Integer)
    extract = relationship(Extract, backref='text_fragment_identifiers')

    xpath_re = re.compile(
        r'xpointer\(start-point\(string-range\(([^,]+),([^,]+),([^,]+)\)\)'
        r'/range-to\(string-range\(([^,]+),([^,]+),([^,]+)\)\)\)')

    def __string__(self):
        return ("xpointer(start-point(string-range(%s,'',%d))/range-to(string-range(%s,'',%d)))" % (
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
