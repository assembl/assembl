# -*- coding: utf-8 -*-

from itertools import chain, groupby
from collections import defaultdict
from abc import ABCMeta, abstractmethod
from datetime import datetime

from bs4 import BeautifulSoup
from rdflib import URIRef
from sqlalchemy.orm import (
    relationship, backref, aliased, contains_eager, joinedload, deferred,
    column_property)
from sqlalchemy.orm.attributes import NO_VALUE
from sqlalchemy.sql import text, column
from sqlalchemy.sql.expression import union_all, bindparam, literal_column

from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Unicode,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
    inspect,
    select,
    func,
)
from sqlalchemy.ext.associationproxy import association_proxy
from virtuoso.vmapping import IriClass, PatternIriClass
from virtuoso.alchemy import SparqlClause

from ..lib.utils import get_global_base_url
from ..nlp.wordcounter import WordCounter
from . import DiscussionBoundBase, HistoryMixin
from .discussion import Discussion
from ..semantic.virtuoso_mapping import (
    QuadMapPatternS, AssemblQuadStorageManager)
from ..auth import (
    CrudPermissions, P_READ, P_ADMIN_DISC, P_EDIT_IDEA,
    P_ADD_IDEA)
from ..semantic.namespaces import (
    SIOC, IDEA, ASSEMBL, DCTERMS, QUADNAMES, FOAF, RDF, VirtRDF)
from ..lib.sqla import (UPDATE_OP, DELETE_OP, INSERT_OP, get_model_watcher)
from assembl.views.traversal import (
    AbstractCollectionDefinition, CollectionDefinition)

if DiscussionBoundBase.using_virtuoso:
    from virtuoso.alchemy import Timestamp
else:
    from sqlalchemy.types import TIMESTAMP as Timestamp


class defaultdictlist(defaultdict):
    def __init__(self):
        super(defaultdictlist, self).__init__(list)


class IdeaVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_idea(self, idea, level, prev_result):
        pass

    def end_visit(self, idea, level, result, child_results):
        return result


class IdeaLinkVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_link(self, link):
        pass


class WordCountVisitor(IdeaVisitor):
    def __init__(self, langs, count_posts=True):
        self.counter = WordCounter(langs)
        self.count_posts = True

    def cleantext(self, text):
        return BeautifulSoup(text or '').get_text().strip()

    def visit_idea(self, idea, level, prev_result):
        if idea.short_title:
            self.counter.add_text(self.cleantext(idea.short_title), 2)
        if idea.long_title:
            self.counter.add_text(self.cleantext(idea.long_title))
        if idea.definition:
            self.counter.add_text(self.cleantext(idea.definition))
        if self.count_posts and level == 0:
            from .generic import Content
            related = text(
                Idea._get_related_posts_statement(),
                bindparams=[bindparam('root_idea_id', idea.id),
                            bindparam('discussion_id', idea.discussion_id)]
                ).columns(column('post_id')).alias('related')
            titles = set()
            # TODO maparent: Reoptimize
            for content in idea.db.query(
                    Content).join(
                    related, related.c.post_id == Content.id):
                body = content.body.first_original().value
                self.counter.add_text(self.cleantext(body), 0.5)
                title = content.subject.first_original().value
                title = self.cleantext(title)
                if title not in titles:
                    self.counter.add_text(title)
                    titles.add(title)

    def best(self, num=8):
        return self.counter.best(num)


class Idea(HistoryMixin, DiscussionBoundBase):
    """
    A core concept taken from the associated discussion
    """
    __tablename__ = "idea"
    ORPHAN_POSTS_IDEA_ID = 'orphan_posts'
    sqla_type = Column(String(60), nullable=False)
    rdf_type = Column(
        String(60), nullable=False, server_default='idea:GenericIdeaNode')

    long_title = Column(
        UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.alternative)})
    short_title = Column(
        UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.title)})
    definition = Column(
        UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.description)})
    hidden = Column(Boolean, server_default='0')
    last_modified = Column(Timestamp)
    # TODO: Make this autoupdate on change. see
    # http://stackoverflow.com/questions/1035980/update-timestamp-when-row-is-updated-in-postgresql

    creation_date = Column(
        DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'),
        nullable=False,
        index=True,
        info={'rdf': QuadMapPatternS(None, SIOC.has_container)})

    discussion = relationship(
        Discussion,
        backref=backref(
            'ideas', order_by=creation_date,
            cascade="all, delete-orphan"),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)}
    )

    #widget_id = deferred(Column(Integer, ForeignKey('widget.id')))
    #widget = relationship("Widget", backref=backref('ideas', order_by=creation_date))

    __mapper_args__ = {
        'polymorphic_identity': 'idea',
        'polymorphic_on': sqla_type,
        # Not worth it for now, as the only other class is RootIdea, and there
        # is only one per discussion - benoitg 2013-12-23
        #'with_polymorphic': '*'
    }

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        discussion_alias = alias_maker.get_reln_alias(cls.discussion)
        return [
            QuadMapPatternS(
                None, RDF.type,
                IriClass(VirtRDF.QNAME_ID).apply(Idea.rdf_type),
                name=QUADNAMES.class_Idea_class),
            QuadMapPatternS(
                None, FOAF.homepage,
                PatternIriClass(
                    QUADNAMES.idea_external_link_iri,
                    # TODO: Use discussion.get_base_url.
                    # This should be computed outside the DB.
                    get_global_base_url() + '/%s/idea/local:Idea/%d', None,
                    ('slug', Unicode, False), ('id', Integer, False)).apply(
                    discussion_alias.slug, cls.id),
                name=QUADNAMES.idea_external_link_map)
        ]

    parents = association_proxy(
        'source_links', 'source',
        creator=lambda idea: IdeaLink(source=idea))

    parents_ts = association_proxy(
        'source_links_ts', 'source_ts',
        creator=lambda idea: IdeaLink(source=idea))

    children = association_proxy(
        'target_links', 'target',
        creator=lambda idea: IdeaLink(target=idea))

    def get_children(self):
        return self.db.query(Idea).join(
            IdeaLink, (IdeaLink.target_id == Idea.id)
            & (IdeaLink.tombstone_date == None)).filter(
            (IdeaLink.source_id == self.id)
            & (Idea.tombstone_date == None)
            ).order_by(IdeaLink.order).all()

    def get_parents(self):
        return self.db.query(Idea).join(
            IdeaLink, (IdeaLink.source_id == Idea.id)
            & (IdeaLink.tombstone_date == None)).filter(
            (IdeaLink.target_id == self.id)
            & (Idea.tombstone_date == None)).all()

    @property
    def parent_uris(self):
        return [Idea.uri_generic(l.source_id) for l in self.source_links]

    @property
    def widget_add_post_endpoint(self):
        # Only for api v2
        from pyramid.threadlocal import get_current_request
        from .widgets import Widget
        req = get_current_request() or {}
        ctx = getattr(req, 'context', {})
        if getattr(ctx, 'get_instance_of_class', None):
            # optional optimization
            widget = ctx.get_instance_of_class(Widget)
            if widget:
                if getattr(widget, 'get_add_post_endpoint', None):
                    return {widget.uri(): widget.get_add_post_endpoint(self)}
            else:
                return self.widget_ancestor_endpoints(self)

    def widget_ancestor_endpoints(self, target_idea=None):
        # HACK. Review consequences after test.
        target_idea = target_idea or self
        inherited = dict()
        for p in self.get_parents():
            inherited.update(p.widget_ancestor_endpoints(target_idea))
        inherited.update({
            widget.uri(): widget.get_add_post_endpoint(target_idea)
            for widget in self.widgets
            if getattr(widget, 'get_add_post_endpoint', None)
        })
        return inherited

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            long_title=self.long_title,
            short_title=self.short_title,
            definition=self.definition,
            hidden=self.hidden,
            creation_date=self.creation_date,
            discussion=self.discussion)
        return super(Idea, self).copy(**kwargs)

    @classmethod
    def get_ancestors_query(
            cls, target_id=bindparam('root_id', type_=Integer),
            inclusive=True):
        if cls.using_virtuoso:
            sql = text(
                """SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                    source_id, target_id FROM idea_idea_link
                    WHERE tombstone_date IS NULL"""
                ).columns(column('source_id'), column('target_id')).alias()
            select_exp = select([sql.c.source_id.label('id')]
                ).select_from(sql).where(sql.c.target_id==target_id)
        else:
            link = select(
                    [IdeaLink.source_id, IdeaLink.target_id]
                ).select_from(
                    IdeaLink
                ).where(
                    (IdeaLink.tombstone_date == None) &
                    (IdeaLink.target_id == target_id)
                ).cte(recursive=True)
            target_alias = aliased(link)
            sources_alias = aliased(IdeaLink)
            parent_link = sources_alias.target_id == target_alias.c.source_id
            parents = select(
                    [sources_alias.source_id, sources_alias.target_id]
                ).select_from(sources_alias).where(parent_link)
            with_parents = link.union_all(parents)
            select_exp = select([with_parents.c.source_id.label('id')]
                ).select_from(with_parents)
        if inclusive:
            if isinstance(target_id, int):
                target_id = literal_column(str(target_id), Integer)
            select_exp = select_exp.union(
                select([target_id.label('id')]))
        return select_exp.alias()

    def get_all_ancestors(self, id_only=False):
        query = self.get_ancestors_query(self.id)
        if id_only:
            return list((id for (id,) in self.db.query(query)))
        else:
            return self.db.query(Idea).filter(Idea.id.in_(query)).all()

    @classmethod
    def get_descendants_query(
            cls, source_id=bindparam('root_id', type_=Integer),
            inclusive=True):
        if cls.using_virtuoso:
            sql = text(
                """SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                    source_id, target_id FROM idea_idea_link
                    WHERE tombstone_date IS NULL"""
                ).columns(column('source_id'), column('target_id')).alias()
            select_exp = select([sql.c.target_id.label('id')]
                ).select_from(sql).where(sql.c.source_id==source_id)
        else:
            link = select(
                    [IdeaLink.source_id, IdeaLink.target_id]
                ).select_from(
                    IdeaLink
                ).where(
                    (IdeaLink.tombstone_date == None) &
                    (IdeaLink.source_id == source_id)
                ).cte(recursive=True)
            source_alias = aliased(link)
            targets_alias = aliased(IdeaLink)
            parent_link = targets_alias.source_id == source_alias.c.target_id
            children = select(
                    [targets_alias.source_id, targets_alias.target_id]
                ).select_from(targets_alias).where(parent_link)
            with_children = link.union_all(children)
            select_exp = select([with_children.c.target_id.label('id')]
                ).select_from(with_children)
        if inclusive:
            if isinstance(source_id, int):
                source_id = literal_column(str(source_id), Integer)
            select_exp = select_exp.union(
                select([source_id.label('id')]))
        return select_exp.alias()

    def get_all_descendants(self, id_only=False):
        query = self.get_descendants_query(self.id)
        if id_only:
            return list((id for (id,) in self.db.query(query)))
        else:
            return self.db.query(Idea).filter(Idea.id.in_(query)).all()

    def get_order_from_first_parent(self):
        return self.source_links[0].order if self.source_links else None

    def get_order_from_first_parent_ts(self):
        return self.source_links_ts[0].order if self.source_links_ts else None

    def get_first_parent_uri(self):
        for link in self.source_links:
            return Idea.uri_generic(link.source_id)

    def get_first_parent_uri_ts(self):
        return Idea.uri_generic(
            self.source_links_ts[0].source_id
        ) if self.source_links_ts else None

    @staticmethod
    def _get_idea_dag_statement(skip_where=False):
        """requires root_idea_id and discussion_id parameters"""
        if skip_where:
            where_clause = \
                '''(SELECT root_idea.id FROM root_idea
                    JOIN idea ON (idea.id = root_idea.id)
                    WHERE idea.discussion_id=:discussion_id)'''
        else:
            where_clause = ':root_idea_id'
        return """(SELECT source_id, target_id FROM (
            SELECT transitive t_in (1) t_out (2) t_distinct T_NO_CYCLES
                        source_id, target_id FROM idea_idea_link WHERE tombstone_date IS NULL
                UNION SELECT id as source_id, id as target_id FROM idea
            ) ia
            JOIN idea AS dag_idea ON (ia.source_id = dag_idea.id)
            WHERE dag_idea.discussion_id = :discussion_id 
                AND ia.source_id = %s)
            AS idea_dag""" % (where_clause,)

    @staticmethod
    def _get_related_posts_statement_no_select(select, skip_where):
        return """%s FROM %s
JOIN idea_content_link ON (idea_content_link.idea_id = idea_dag.target_id)
JOIN idea_content_positive_link
    ON (idea_content_positive_link.id = idea_content_link.id)
JOIN post AS root_posts ON (idea_content_link.content_id = root_posts.id)
JOIN post AS family_posts ON (
    (family_posts.ancestry <> ''
    AND family_posts.ancestry LIKE root_posts.ancestry || cast(root_posts.id as varchar) || ',' || '%%'
    )
    OR family_posts.id = root_posts.id
)
JOIN content AS family_content ON (family_posts.id = family_content.id AND family_content.hidden = 0)
""" % (select, Idea._get_idea_dag_statement(skip_where))

    @staticmethod
    def _get_related_posts_statement(skip_where=False):
        return Idea._get_related_posts_statement_no_select(
            "SELECT DISTINCT family_posts.id as post_id", skip_where)

    @staticmethod
    def _get_count_related_posts_statement():
        return Idea._get_related_posts_statement_no_select(
            "SELECT COUNT(DISTINCT family_posts.id) as total_count", False)

    @staticmethod
    def _get_orphan_posts_statement_no_select(select):
        """ Requires discussion_id bind parameters 
        Excludes synthesis posts """
        return select + """
           FROM post
           JOIN content ON ( content.id = post.id
                            AND content.discussion_id = :discussion_id
                            AND content.type <> 'synthesis_post')
           EXCEPT corresponding BY (post_id) (
             SELECT DISTINCT post.id AS post_id FROM post
              JOIN post AS root_posts ON ( (post.ancestry <> ''
                           AND post.ancestry LIKE root_posts.ancestry || cast(root_posts.id as varchar) || ',' || '%' )
                         OR post.id = root_posts.id)
              JOIN idea_content_link ON (idea_content_link.content_id = root_posts.id)
              JOIN idea_content_positive_link ON (idea_content_positive_link.id = idea_content_link.id)
              JOIN idea ON (idea_content_link.idea_id = idea.id)
             WHERE idea.discussion_id = :discussion_id
             AND idea.tombstone_date IS NULL AND idea.hidden = 0)"""

    @staticmethod
    def _get_count_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return "SELECT COUNT(post_id) as total_count from (%s) orphans" % (
            Idea._get_orphan_posts_statement())

    @staticmethod
    def _get_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select(
            "SELECT post.id as post_id")

    @property
    def num_posts(self):
        """ This is extremely naive and slow, but as this is all temp code
        until we move to a graph database, it will probably do for now """
        result = self.db.execute(text(
            Idea._get_count_related_posts_statement()),
            {"root_idea_id": self.id, "discussion_id": self.discussion_id})
        return int(result.first()['total_count'])

    @property
    def num_read_posts(self):
        """ Worse than above... but temporary """
        connection = self.db.connection()
        user_id = connection.info.get('userid', None)
        return self.num_read_posts_for(user_id)

    @property
    def num_total_and_read_posts(self):
        connection = self.db.connection()
        user_id = connection.info.get('userid', None)
        if user_id:
            return self.num_total_and_read_posts_for(user_id)
        else:
            return (self.num_posts, 0)

    def num_read_posts_for(self, user_id):
        if not user_id:
            return 0
        join = """JOIN action_on_post ON (action_on_post.post_id = family_posts.id)
                  JOIN action ON (action.id = action_on_post.id)
                  WHERE action.actor_id = :user_id
                  AND action.tombstone_date IS NULL
                  AND action.type = 'version:ReadStatusChange_P'"""

        result = self.db.execute(text(
            Idea._get_count_related_posts_statement() + join),
            {"root_idea_id": self.id, "user_id": user_id,
             "discussion_id": self.discussion_id})
        return int(result.first()['total_count'])

    def num_total_and_read_posts_for(self, user_id):
        if not user_id:
            return 0
        select = """SELECT COUNT(DISTINCT family_posts.id) as total_count,
                    COUNT(DISTINCT action.id) as read_count """
        join = """LEFT JOIN action_on_post ON (action_on_post.post_id = family_posts.id)
                  LEFT JOIN action ON (action.id = action_on_post.id
                  AND action.actor_id = :user_id
                  AND action.tombstone_date IS NULL
                  AND action.type = 'version:ReadStatusChange_P')"""
        result = self.db.execute(text(
            Idea._get_related_posts_statement_no_select(select, False) + join),
            {"root_idea_id": self.id, "user_id": user_id,
             "discussion_id": self.discussion_id}).first()
        return (int(result['total_count']), int(result['read_count']))

    def prefetch_descendants(self):
        # TODO: descendants only. Let's just prefetch all ideas.
        self.db.query(Idea).filter_by(
            discussion_id=self.discussion_id, tombstone_date=None).all()
        self.db.query(IdeaLink).join(
            Idea, IdeaLink.source_id == Idea.id).filter(
            Idea.discussion_id == self.discussion_id,
            IdeaLink.tombstone_date == None).all()

    def visit_ideas_depth_first(self, idea_visitor):
        self.prefetch_descendants()
        return self._visit_ideas_depth_first(idea_visitor, set(), 0, None)

    def _visit_ideas_depth_first(
            self, idea_visitor, visited, level, prev_result):
        if self in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = idea_visitor.visit_idea(self, level, prev_result)
        visited.add(self)
        child_results = []
        if result is not IdeaVisitor.CUT_VISIT:
            for child in self.get_children():
                r = child._visit_ideas_depth_first(
                    idea_visitor, visited, level+1, result)
                if r:
                    child_results.append(r)
        return idea_visitor.end_visit(self, level, result, child_results)

    def visit_ideas_breadth_first(self, idea_visitor):
        self.prefetch_descendants()
        result = idea_visitor.visit_idea(self, 0, None)
        visited = {self}
        if result is not IdeaVisitor.CUT_VISIT:
            return self._visit_ideas_breadth_first(
                idea_visitor, visited, 1, result)

    def _visit_ideas_breadth_first(
            self, idea_visitor, visited, level, prev_result):
        children = []
        result = True
        child_results = []
        for child in self.get_children():
            if child in visited:
                continue
            result = idea_visitor.visit_idea(child, level, prev_result)
            visited.add(child)
            if result != IdeaVisitor.CUT_VISIT:
                children.append(child)
                if result:
                    child_results.append(result)
        for child in children:
            child._visit_ideas_breadth_first(
                idea_visitor, visited, level+1, result)
        return idea_visitor.end_visit(self, level, prev_result, child_results)

    def most_common_words(self, lang=None, num=8):
        if lang:
            langs = (lang,)
        else:
            langs = self.discussion.discussion_locales
        word_counter = WordCountVisitor(langs)
        self.visit_ideas_depth_first(word_counter)
        return word_counter.best(num)

    @property
    def most_common_words_prop(self):
        return self.most_common_words()

    def get_siblings_of_type(self, cls):
        # TODO: optimize
        siblings = set(chain(*(p.children for p in self.get_parents())))
        if siblings:
            siblings.remove(self)
        return [c for c in siblings if isinstance(c, cls)]

    def get_synthesis_contributors(self, id_only=True):
        # author of important extracts
        from .idea_content_link import Extract
        from .auth import AgentProfile
        from .post import Post
        from sqlalchemy.sql.functions import count
        local_uri = AssemblQuadStorageManager.local_uri()
        discussion_storage = \
            AssemblQuadStorageManager.discussion_storage_name()

        idea_uri = URIRef(self.uri(local_uri))
        clause = '''select distinct ?annotation where {
            %s idea:includes* ?ideaP .
            ?annotation assembl:resourceExpressesIdea ?ideaP }'''
        extract_ids = [x for (x,) in self.db.execute(
            SparqlClause(clause % (
                idea_uri.n3(),),
                quad_storage=discussion_storage.n3()))]
        r = list(self.db.query(AgentProfile.id, count(Extract.id)).join(
            Post, Post.creator_id==AgentProfile.id).join(Extract).filter(
            Extract.important == True, Extract.id.in_(extract_ids)))
        r.sort(key=lambda x: x[1], reverse=True)
        if id_only:
            return [AgentProfile.uri_generic(a) for (a, ce) in r]
        else:
            ids = [a for (a, ce) in r]
            order = {id: order for (order, id) in enumerate(ids)}
            agents = self.db.query(AgentProfile).filter(AgentProfile.id.in_(ids)).all()
            agents.sort(key=lambda a: order[a.id])
            return agents

    def get_contributors(self):
        # anyone who contributed to any of the idea's posts
        local_uri = AssemblQuadStorageManager.local_uri()
        discussion_storage = \
            AssemblQuadStorageManager.discussion_storage_name()

        idea_uri = URIRef(self.uri(local_uri))
        clause = '''select count(distinct ?postP), count(distinct ?post), ?author where {
            %s idea:includes* ?ideaP .
            ?postP assembl:postLinkedToIdea ?ideaP  .
            ?post sioc:reply_of* ?postP .
            ?post sioc:has_creator ?author }'''
        r = self.db.execute(
            SparqlClause(clause % (
                idea_uri.n3(),),
                quad_storage=discussion_storage.n3()))
        r = [(int(cpp), int(cp), 'local:AgentProfile/' + a.rsplit('/',1)[1]
              ) for (cpp, cp, a) in r]
        r.sort(reverse=True)
        return [a for (cpp, cp, a) in r]

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    def get_definition_preview(self):
        body = self.definition.strip()
        target_len = 120
        shortened = False
        html_len = 2 * target_len
        while True:
            text = BeautifulSoup(body[:html_len]).get_text().strip()
            if html_len >= len(body) or len(text) > target_len:
                shortened = html_len < len(body)
                body = text
                break
            html_len += target_len
        if len(body) > target_len:
            body = body[:target_len].rsplit(' ', 1)[0].rstrip() + ' '
        elif shortened:
            body += ' '
        return body

    def get_url(self):
        from assembl.lib.frontend_urls import FrontendUrls
        frontendUrls = FrontendUrls(self.discussion)
        return frontendUrls.get_idea_url(self)

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    def send_to_changes(self, connection=None, operation=UPDATE_OP,
                        discussion_id=None, view_def="changes"):
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(
                connection, DELETE_OP, discussion_id, view_def)
        else:
            super(Idea, self).send_to_changes(
                connection, operation, discussion_id, view_def)
        watcher = get_model_watcher()
        if operation == UPDATE_OP:
            watcher.processIdeaModified(self.id, 0)  # no versions yet.
        elif operation == DELETE_OP:
            watcher.processIdeaDeleted(self.id)
        elif operation == INSERT_OP:
            watcher.processIdeaCreated(self.id)

    def __repr__(self):
        r = super(Idea, self).__repr__()
        title = self.short_title or ""
        return r[:-1] + title.encode("ascii", "ignore") + ">"

    @classmethod
    def invalidate_ideas(cls, discussion_id, post_id):
        raise NotImplemented()

    @classmethod
    def get_idea_ids_showing_post(cls, post_id, direct=False, indirect=True):
        "Given a post, give the ID of the ideas that show this message"
        # This works because of a virtuoso bug...
        # where DISTINCT gives IDs instead of URIs.
        from .generic import Content
        from .idea_content_link import Extract
        assert direct or indirect
        discussion_storage = \
            AssemblQuadStorageManager.discussion_storage_name()

        post_uri = URIRef(Content.uri_generic(
            post_id, AssemblQuadStorageManager.local_uri()))
        if indirect and not direct:
            clause = '''select distinct ?idea where {
                %s sioc:reply_of* ?post .
                ?post assembl:postLinkedToIdea ?ideaP .
                ?idea idea:includes* ?ideaP }'''
        elif direct and not indirect:
            clause = '''select distinct ?idea where {
                %s sioc:reply_of* ?post .
                ?post assembl:postLinkedToIdea ?idea }'''
        if direct and indirect:
            # Not used anymore, to be cleaned.
            clause = '''select distinct ?postP, ?ideaP, ?idea, ?ex where {
                %s sioc:reply_of* ?postP .
                ?postP assembl:postLinkedToIdea ?ideaP  .
                ?idea idea:includes* ?ideaP .
                optional { ?ex oa:hasSource ?postP ;
                    assembl:resourceExpressesIdea ?ideaP . } }'''
            r = list(cls.default_db.execute(
                SparqlClause(clause % (
                    post_uri.n3(),),
                    quad_storage=discussion_storage.n3())))
            r = [(int(x), int(y), int(z), int(e) if e else None)
                 for (x, y, z, e) in r]

            def comp((pp1, ip1, i1, e1), (pp2, ip2, i2, e2)):
                direct_idea1 = ip1 == i1
                direct_idea2 = ip2 == i2
                direct_post1 = pp1 == post_id
                direct_post2 = pp2 == post_id
                if direct_idea1 != direct_idea2:
                    return -1 if direct_idea1 else 1
                if direct_post1 != direct_post2:
                    return -1 if direct_post1 else 1
                if pp1 != pp2:
                    # assume hry is congruent with post order.
                    return pp2 - pp1
                if ip1 != ip2:
                    # TODO: Real hry order. Should be rare.
                    return ip2 - ip1
                if i1 != i2:
                    # TODO: Real hry order.
                    return i2 - i1
                if e1 != e2:
                    return e2 - e1
                return 0
            r.sort(cmp=comp)
            # can't trust virtuoso's uniqueness.
            r = [e for e, _ in groupby(r)]
            return [(
                Idea.uri_generic(i),
                Idea.uri_generic(ip),
                Content.uri_generic(pp),
                Extract.uri_generic(ex) if ex else None
            ) for (pp, ip, i, ex) in r]
        else:
            return [int(id) for (id,) in cls.default_db.execute(
                SparqlClause(clause % (
                    post_uri.n3(),),
                    quad_storage=discussion_storage.n3()))]

    @classmethod
    def idea_read_counts_sparql(cls, discussion_id, post_id, user_id):
        """Given a post and a user, give the total and read count
         of posts for each affected idea
        This one is slower than the sql version below."""
        from .auth import AgentProfile
        local_uri = AssemblQuadStorageManager.local_uri()
        discussion_storage = \
            AssemblQuadStorageManager.discussion_storage_name()
        idea_ids = cls.get_idea_ids_showing_post(post_id)
        user_uri = URIRef(AgentProfile.uri_generic(user_id, local_uri)).n3()
        results = []
        for idea_id in idea_ids:
            ((read,),) = list(cls.default_db.execute(SparqlClause(
            """select count(distinct ?change) where {
            %s idea:includes* ?ideaP .
            ?postP assembl:postLinkedToIdea ?ideaP .
            ?post sioc:reply_of* ?postP .
            ?change a version:ReadStatusChange;
                version:who %s ;
                version:what ?post }""" % (
                URIRef(Idea.uri_generic(idea_id, local_uri)).n3(),
                user_uri), quad_storage=discussion_storage.n3())))
            results.append((idea_id, read))
        return results

    @classmethod
    def idea_read_counts(cls, discussion_id, post_id, user_id):
        """Given a post and a user, give the total and read count
            of posts for each affected idea"""
        idea_ids = cls.get_idea_ids_showing_post(post_id)
        if not idea_ids:
            return []
        ideas = cls.default_db.query(cls).filter(cls.id.in_(idea_ids))
        return [(idea.id, idea.num_read_posts_for(user_id))
                for idea in ideas]

    def get_widget_creation_urls(self):
        from .widgets import GeneratedIdeaWidgetLink
        return [wl.context_url for wl in self.widget_links
                if isinstance(wl, GeneratedIdeaWidgetLink)]

    # def get_notifications(self):
    #     # Dead code?
    #     from .widgets import BaseIdeaWidgetLink
    #     for widget_link in self.widget_links:
    #         if not isinstance(self, BaseIdeaWidgetLink):
    #             continue
    #         for n in widget_link.widget.has_notification():
    #             yield n

    @classmethod
    def get_all_idea_links(cls, discussion_id):
        target = aliased(cls)
        source = aliased(cls)
        return cls.default_db.query(
            IdeaLink).join(
            source, source.id == IdeaLink.source_id).join(
            target, target.id == IdeaLink.target_id).filter(
            target.discussion_id == discussion_id).filter(
            source.discussion_id == discussion_id).filter(
            IdeaLink.tombstone_date == None).all()

    @classmethod
    def extra_collections(cls):
        from .votes import AbstractIdeaVote
        from .widgets import (
            Widget, IdeaWidgetLink, VotedIdeaWidgetLink, InspirationWidget)
        from .idea_content_link import (
            IdeaRelatedPostLink, IdeaContentWidgetLink)
        from .generic import Content

        class ChildIdeaCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(ChildIdeaCollectionDefinition, self).__init__(cls, Idea)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                parent = owner_alias
                children = last_alias
                return query.join(
                    IdeaLink, IdeaLink.target_id == children.id).join(
                    parent, IdeaLink.source_id == parent.id).filter(
                    IdeaLink.source_id == parent_instance.id,
                    IdeaLink.tombstone_date == None,
                    children.tombstone_date == None)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                if isinstance(instance, Idea):
                    assocs.append(IdeaLink(
                        source=parent_instance, target=instance,
                        **self.filter_kwargs(
                            IdeaLink, kwargs)))

            def contains(self, parent_instance, instance):
                return instance.db.query(
                    IdeaLink).filter_by(
                    source=parent_instance, target=instance
                    ).count() > 0

        class AncestorWidgetsCollectionDefinition(AbstractCollectionDefinition):
            # For widgets which represent general configuration.

            def __init__(self, cls, widget_subclass=None):
                super(AncestorWidgetsCollectionDefinition, self).__init__(cls, Widget)
                self.widget_subclass = widget_subclass

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                parent = owner_alias
                widgets = last_alias
                ancestry = parent_instance.get_ancestors_query(
                    parent_instance.id)
                ancestors = aliased(Idea)
                iwlink = aliased(IdeaWidgetLink)
                query = query.join(iwlink).join(ancestors).filter(
                    ancestors.id.in_(ancestry)).join(
                    parent, parent.id == parent_instance.id)
                if self.widget_subclass is not None:
                    query = query.filter(iwlink.widget.of_type(self.widget_subclass))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                if isinstance(instance, Content):
                    assocs.append(
                        IdeaContentWidgetLink(
                            content=instance, widget=parent_instance,
                            creator_id=instance.creator_id,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))

            def contains(self, parent_instance, instance):
                ancestors = aliased(Idea)
                iwlink = aliased(IdeaWidgetLink)
                ancestry = parent_instance.get_ancestors_query(
                    parent_instance.id)
                query = instance.db.query(Widget).join(iwlink).join(
                    ancestors).filter(ancestors.id.in_(ancestry)).filter(
                    Widget.id == instance.id)
                if self.widget_subclass is not None:
                    query = query.filter(iwlink.widget.of_type(self.widget_subclass))
                return query.count() > 0

        class LinkedPostCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(LinkedPostCollectionDefinition, self).__init__(
                    cls, Content)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                return query.join(IdeaRelatedPostLink, owner_alias)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                # This is going to spell trouble: Sometimes we'll have creator,
                # other times creator_id
                if isinstance(instance, Content):
                    assocs.append(
                        IdeaRelatedPostLink(
                            content=instance, idea=parent_instance,
                            creator_id=instance.creator_id,
                            **self.filter_kwargs(
                                IdeaRelatedPostLink, kwargs)))

            def contains(self, parent_instance, instance):
                return instance.db.query(
                    IdeaRelatedPostLink).filter_by(
                    content=instance, idea=parent_instance
                    ).count() > 0

        class WidgetPostCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(WidgetPostCollectionDefinition, self).__init__(
                    cls, Content)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                from .post import IdeaProposalPost
                idea = owner_alias
                query = query.join(IdeaContentWidgetLink).join(
                    idea,
                    IdeaContentWidgetLink.idea_id == parent_instance.id)
                if Content in chain(*(
                        mapper.entities for mapper in query._entities)):
                    query = query.options(
                        contains_eager(Content.widget_idea_links))
                        # contains_eager(Content.extracts) seems to slow things down instead
                # Filter out idea proposal posts
                query = query.filter(last_alias.type.notin_(
                    IdeaProposalPost.polymorphic_identities()))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                # This is going to spell trouble: Sometimes we'll have creator,
                # other times creator_id
                if isinstance(instance, Content):
                    if parent_instance.proposed_in_post:
                        instance.set_parent(parent_instance.proposed_in_post)
                    assocs.append(
                        IdeaContentWidgetLink(
                            content=instance, idea=parent_instance,
                            creator_id=instance.creator_id,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))
                    instance.hidden = True

            def contains(self, parent_instance, instance):
                return instance.db.query(
                    IdeaContentWidgetLink).filter_by(
                    content=instance, idea=parent_instance
                    ).count() > 0

        class ActiveShowingWidgetsCollection(CollectionDefinition):
            def __init__(self, cls):
                super(ActiveShowingWidgetsCollection, self).__init__(
                    cls, cls.active_showing_widget_links)
            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                from .widgets import IdeaShowingWidgetLink
                idea = owner_alias
                widget_idea_link = last_alias
                query = query.join(
                    idea, widget_idea_link.idea).join(
                    Widget, widget_idea_link.widget).filter(
                    Widget.test_active(),
                    widget_idea_link.type.in_(
                        IdeaShowingWidgetLink.polymorphic_identities()),
                    idea.id == parent_instance.id)
                return query

        return {'children': ChildIdeaCollectionDefinition(cls),
                'linkedposts': LinkedPostCollectionDefinition(cls),
                'widgetposts': WidgetPostCollectionDefinition(cls),
                'ancestor_widgets': AncestorWidgetsCollectionDefinition(cls),
                'ancestor_inspiration_widgets': AncestorWidgetsCollectionDefinition(
                    cls, InspirationWidget),
                'active_showing_widget_links': ActiveShowingWidgetsCollection(cls)}

    def widget_link_signatures(self):
        from .widgets import Widget
        return [
            {'widget': Widget.uri_generic(l.widget_id),
             '@type': l.external_typename()}
            for l in self.widget_links]

    def active_widget_uris(self):
        from .widgets import Widget
        return [Widget.uri_generic(l.widget_id)
                for l in self.active_showing_widget_links]

    crud_permissions = CrudPermissions(
        P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_ADMIN_DISC, P_ADMIN_DISC,
        P_ADMIN_DISC)


class RootIdea(Idea):
    """
    The root idea.  It represents the discussion.

    If has implicit links to all content and posts in the discussion.
    """
    root_for_discussion = relationship(
        Discussion,
        backref=backref('root_idea', uselist=False),
    )

    __mapper_args__ = {
        'polymorphic_identity': 'root_idea',
    }

    @property
    def num_posts(self):
        """ In the root idea, this is the count of all mesages in the system """
        from .post import Post
        result = self.db.query(Post).filter(
            Post.discussion_id == self.discussion_id,
            Post.hidden==False
        ).count()
        return int(result)

    @property
    def num_total_and_read_posts(self):
        return (self.num_posts, self.num_read_posts)

    @property
    def num_orphan_posts(self):
        "The number of posts unrelated to any idea in the current discussion"
        result = self.db.execute(text(
            Idea._get_count_orphan_posts_statement()).params(
            discussion_id=self.discussion_id))
        return int(result.first()['total_count'])

    @property
    def num_synthesis_posts(self):
        """ In the root idea, this is the count of all mesages in the system """
        from .post import Post, SynthesisPost
        result = self.db.query(SynthesisPost).filter(
            Post.discussion_id == self.discussion_id
        ).count()
        return int(result)

    def discussion_topic(self):
        return self.discussion.topic

    crud_permissions = CrudPermissions(P_ADMIN_DISC)


class IdeaLink(HistoryMixin, DiscussionBoundBase):
    """
    A generic link between two ideas

    If a parent-child relation, the parent is the source, the child the target.
    Beware: it's reversed in the RDF model. We will change things around.
    """
    __tablename__ = 'idea_idea_link'
    rdf_class = IDEA.InclusionRelation
    rdf_type = Column(
        String(60), nullable=False, server_default='idea:InclusionRelation')
    source_id = Column(
        Integer, ForeignKey(
            'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
        #info={'rdf': QuadMapPatternS(None, IDEA.target_idea)})
    target_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    source = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.source_id, "
                    "IdeaLink.tombstone_date == None, "
                    "Idea.tombstone_date == None)",
        backref=backref('target_links', cascade="all, delete-orphan"),
        foreign_keys=(source_id))
    target = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.target_id, "
                    "IdeaLink.tombstone_date == None, "
                    "Idea.tombstone_date == None)",
        backref=backref('source_links', cascade="all, delete-orphan"),
        foreign_keys=(target_id))
    source_ts = relationship(
        'Idea',
        backref=backref('target_links_ts', cascade="all, delete-orphan"),
        foreign_keys=(source_id))
    target_ts = relationship(
        'Idea',
        backref=backref('source_links_ts', cascade="all, delete-orphan"),
        foreign_keys=(target_id))
    order = Column(
        Float, nullable=False, default=0.0,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.link_order)})

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        if alias_maker is None:
            idea_link = alias or cls
            source_idea = Idea
        else:
            idea_link = alias or alias_maker.alias_from_class(cls)
            source_idea = alias_maker.alias_from_relns(idea_link.source)

        # Assume tombstone status of target is similar to source, for now.
        return ((idea_link.tombstone_date == None),
                (idea_link.source_id == source_idea.id),
                (source_idea.tombstone_date == None))

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        idea_link = alias_maker.alias_from_class(cls)
        target_alias = alias_maker.alias_from_relns(cls.target)
        source_alias = alias_maker.alias_from_relns(cls.source)
        # Assume tombstone status of target is similar to source, for now.
        conditions = [(idea_link.target_id == target_alias.id),
                      (target_alias.tombstone_date == None)]
        if discussion_id:
            conditions.append((target_alias.discussion_id == discussion_id))
        return [
            QuadMapPatternS(
                Idea.iri_class().apply(idea_link.source_id),
                IDEA.includes,
                Idea.iri_class().apply(idea_link.target_id),
                conditions=conditions,
                name=QUADNAMES.idea_inclusion_reln),
            QuadMapPatternS(
                cls.iri_class().apply(idea_link.id),
                IDEA.source_idea,  # Note that RDF is inverted
                Idea.iri_class().apply(idea_link.target_id),
                conditions=conditions,
                name=QUADNAMES.col_pattern_IdeaLink_target_id
                #exclude_base_condition=True
                ),
            QuadMapPatternS(
                cls.iri_class().apply(idea_link.id),
                IDEA.target_idea,
                Idea.iri_class().apply(idea_link.source_id),
                name=QUADNAMES.col_pattern_IdeaLink_source_id
                ),
            QuadMapPatternS(
                None, RDF.type, IriClass(VirtRDF.QNAME_ID).apply(IdeaLink.rdf_type),
                name=QUADNAMES.class_IdeaLink_class),
        ]

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            order=self.order,
            source_id=self.source_id,
            target_id=self.target_id)
        return super(IdeaLink, self).copy(**kwargs)

    def get_discussion_id(self):
        source = self.source_ts or Idea.get(self.source_id)
        return source.get_discussion_id()

    def send_to_changes(self, connection=None, operation=UPDATE_OP,
                        discussion_id=None, view_def="changes"):
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(
                connection, DELETE_OP, discussion_id, view_def)
        else:
            super(IdeaLink, self).send_to_changes(
                connection, operation, discussion_id, view_def)

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            idea_link = cls
            source_idea = Idea
        else:
            idea_link = alias_maker.alias_from_class(cls)
            source_idea = alias_maker.alias_from_relns(idea_link.source)
        return ((idea_link.source_id == source_idea.id),
                (source_idea.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(
        P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA, P_EDIT_IDEA, P_EDIT_IDEA)

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, backref="idea_links",
        secondary=Idea.__table__, primaryjoin=(source_id == Idea.id),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})


_it = Idea.__table__
_ilt = IdeaLink.__table__
Idea.num_children = column_property(
    select([func.count(_ilt.c.id)]).where(
        (_ilt.c.source_id == _it.c.id)
        & (_ilt.c.tombstone_date == None)
        & (_it.c.tombstone_date == None)
        ).correlate_except(_ilt),
    deferred=True)
