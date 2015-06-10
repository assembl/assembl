# -*- coding: utf-8 -*-

from itertools import chain
from collections import defaultdict
from abc import ABCMeta, abstractmethod
from datetime import datetime

from bs4 import BeautifulSoup
from rdflib import URIRef
from sqlalchemy.orm import (
    relationship, backref, aliased, contains_eager, joinedload)
from sqlalchemy.orm.attributes import NO_VALUE
from sqlalchemy.sql import text, column
from sqlalchemy.sql.expression import union_all
from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
    inspect,
)
from sqlalchemy.ext.associationproxy import association_proxy
from virtuoso.vmapping import IriClass
from virtuoso.alchemy import SparqlClause, Timestamp

from ..lib import config
from ..nlp.wordcounter import WordCounter
from . import DiscussionBoundBase, HistoryMixin
from .discussion import Discussion
from ..semantic.virtuoso_mapping import (
    QuadMapPatternS, AssemblQuadStorageManager)
from ..auth import (
    CrudPermissions, P_READ, P_ADMIN_DISC, P_EDIT_IDEA,
    P_ADD_IDEA)
from ..semantic.namespaces import (
    SIOC, IDEA, ASSEMBL, DCTERMS, QUADNAMES, RDF, VirtRDF)
from ..lib.sqla import (UPDATE_OP, DELETE_OP, INSERT_OP, get_model_watcher)
from assembl.views.traversal import AbstractCollectionDefinition


class defaultdictlist(defaultdict):
    def __init__(self):
        super(defaultdictlist, self).__init__(list)


class IdeaVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_idea(self, idea, level, prev_result):
        pass


class IdeaLinkVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_link(self, link):
        pass


class GraphViewIdeaVisitor(IdeaVisitor):
    def __init__(self, graph_view):
        self.graph_view = graph_view

    def visit_idea(self, idea, level, prev_result):
        # not the most efficient, but everything was prefetched
        if idea in self.graph_view.get_ideas():
            return self.do_visit_idea(idea, level, prev_result)

    @abstractmethod
    def do_visit_idea(self, idea, level, prev_result):
        pass


class WordCountVisitor(IdeaVisitor):
    def __init__(self, langs):
        self.counter = WordCounter(langs)

    def cleantext(self, text):
        return BeautifulSoup(text).get_text().strip()

    def visit_idea(self, idea, level, prev_result):
        if idea.short_title:
            self.counter.add_text(self.cleantext(idea.short_title))
        if idea.long_title:
            self.counter.add_text(self.cleantext(idea.long_title))
        if idea.definition:
            self.counter.add_text(self.cleantext(idea.definition))

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
        return [QuadMapPatternS(
            None, RDF.type, IriClass(VirtRDF.QNAME_ID).apply(Idea.rdf_type),
            name=QUADNAMES.class_Idea_class)]

    parents = association_proxy(
        'source_links', 'source',
        creator=lambda idea: IdeaLink(source=idea))

    parents_ts = association_proxy(
        'source_links_ts', 'source_ts',
        creator=lambda idea: IdeaLink(source=idea))

    children = association_proxy(
        'target_links', 'target',
        creator=lambda idea: IdeaLink(target=idea))

    @property
    def widget_add_post_endpoint(self):
        return self.widget_ancestor_endpoints()

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

    def widget_ancestor_endpoints(self, target_idea=None):
        # HACK. Review consequences after test.
        target_idea = target_idea or self
        inherited = dict()
        for p in self.parents:
            inherited.update(p.widget_ancestor_endpoints(target_idea))
        inherited.update({
            widget.uri(): widget.get_add_post_endpoint(target_idea)
            for widget in self.widgets
            if getattr(widget, 'get_add_post_endpoint', None)
        })
        return inherited

    def get_all_ancestors(self):
        """ Get all ancestors of this idea by following source links.
        This is naive and slow, but not used very much for now.
        TODO:  Rewrite once we migrate to virtuoso"""
        sql = '''SELECT * FROM idea JOIN (
                  SELECT source_id FROM (
                    SELECT transitive t_in (1) t_out (2) t_distinct T_NO_CYCLES
                        source_id, target_id FROM idea_idea_link WHERE tombstone_date IS NULL) ia
                  JOIN idea AS dag_idea ON (ia.source_id = dag_idea.id)
                  WHERE dag_idea.discussion_id = :discussion_id
                  AND ia.target_id=:idea_id) x on (id=source_id)'''
        ancestors = self.db.query(Idea).from_statement(text(sql).bindparams(
            discussion_id=self.discussion_id, idea_id=self.id))

        return ancestors.all()

    def get_order_from_first_parent(self):
        return self.source_links[0].order if self.source_links else None

    def get_order_from_first_parent_ts(self):
        return self.source_links_ts[0].order if self.source_links_ts else None

    def get_first_parent_uri(self):
        return Idea.uri_generic(
            self.source_links[0].source_id
        ) if self.source_links else None

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
        """ Requires discussion_id bind parameters """
        return select + """
           FROM post
           JOIN content ON ( content.id = post.id
                            AND content.discussion_id = :discussion_id )
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

    def num_read_posts_for(self, user_id):
        if not user_id:
            return 0
        join = """JOIN action_on_post ON (action_on_post.post_id = family_posts.id)
                  JOIN action ON (action.id = action_on_post.id)
                  WHERE action.actor_id = :user_id
                  AND action.type = 'version:ReadStatusChange'"""

        result = self.db.execute(text(
            Idea._get_count_related_posts_statement() + join),
            {"root_idea_id": self.id, "user_id": user_id,
             "discussion_id": self.discussion_id})
        return int(result.first()['total_count'])

    def prefetch_descendants(self):
        pass  # TODO

    def visit_ideas_depth_first(self, idea_visitor):
        self.prefetch_descendants()
        self._visit_ideas_depth_first(idea_visitor, set(), 0, None)

    def _visit_ideas_depth_first(
            self, idea_visitor, visited, level, prev_result):
        if self in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = idea_visitor.visit_idea(self, level, prev_result)
        visited.add(self)
        if result is not IdeaVisitor.CUT_VISIT:
            for child in self.children:
                child._visit_ideas_depth_first(
                    idea_visitor, visited, level+1, result)

    def visit_ideas_breadth_first(self, idea_visitor):
        self.prefetch_descendants()
        result = idea_visitor.visit_idea(self, 0, None)
        visited = {self}
        if result is not IdeaVisitor.CUT_VISIT:
            self._visit_ideas_breadth_first(idea_visitor, visited, 1, result)

    def _visit_ideas_breadth_first(
            self, idea_visitor, visited, level, prev_result):
        children = []
        result = True
        for child in self.children:
            if child in visited:
                continue
            result = idea_visitor.visit_idea(child, level, prev_result)
            visited.add(child)
            if result != IdeaVisitor.CUT_VISIT:
                children.append(child)
        for child in children:
            child._visit_ideas_breadth_first(
                idea_visitor, visited, level+1, result)

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
        siblings = set(chain(*(p.children for p in self.parents)))
        if siblings:
            siblings.remove(self)
        return [c for c in siblings if isinstance(c, cls)]

    def get_voting_results(self):
        by_criterion = defaultdict(defaultdictlist)
        latest_by_criterion = defaultdictlist()
        for vote in self.votes:
            by_criterion[vote.criterion][vote.voter_id].append(vote)
        for criterion, by_user in by_criterion.iteritems():
            for voter, votes in by_user.iteritems():
                votes = sorted(votes, key=lambda vote: vote.vote_date)
                latest_by_criterion[criterion].append(votes.pop())
        return {
            criterion.uri():
            sum((v.vote_value for v in votes))/len(votes)
            # If you want to combine average and count in one structure:
            # (sum((v.vote_value for v in votes))/len(votes), len(votes))
            for criterion, votes in latest_by_criterion.iteritems()
        }

    def get_vote_count(self):
        by_criterion = defaultdict(defaultdictlist)
        latest_by_criterion = defaultdictlist()
        for vote in self.votes:
            by_criterion[vote.criterion][vote.voter_id].append(vote)
        for criterion, by_user in by_criterion.iteritems():
            for voter, votes in by_user.iteritems():
                votes = sorted(votes, key=lambda vote: vote.vote_date)
                latest_by_criterion[criterion].append(votes.pop())
        return {
            criterion.uri(): len(votes)
            for criterion, votes in latest_by_criterion.iteritems()
        }

    def get_contributors(self):
        return self._get_contributors(True, False)

    def _get_contributors(self, indirect=True, id_only=True):
        from .post import Post
        from .auth import AgentProfile
        from .idea_content_link import Extract
        # Get extracts related to the idea
        extracts = self.db.query(Extract).join(
            Extract.extract_source.of_type(Post)).filter(
            Extract.idea_id == self.id).options(
            joinedload(Extract.extract_source)).all()
        extracts_by_author = defaultdict(list)
        for e in extracts:
            extracts_by_author[e.extract_source.creator_id].append(e)
        author_ids = extracts_by_author.keys()

        def priority(author_id):
            extracts = extracts_by_author[author_id]
            return (-len([e for e in extracts if e.important]), -len(extracts))
        # Sort authors by number of important extracts, then extracts
        author_ids.sort(key=priority)
        if indirect and extracts:
            # Get ids of all messages replying one of those extracts's messages
            root_posts = list({e.content_id for e in extracts})
            pattern = """SELECT id FROM (
                    SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                        id, parent_id FROM post ) pa%d
                WHERE parent_id = :post_id%d"""
            if len(root_posts) > 1:
                union = union_all(
                    *[text(pattern % (n, n)).columns(
                        column('id')).bindparams(**{'post_id'+str(n): id})
                      for n, id in enumerate(root_posts)])
            else:
                union = text(pattern % (0, 0)).columns(
                    column('id')).bindparams(post_id0=root_posts[0])
            # get those messages' authors. Sort by most recent
            indirect_authors = self.db.query(AgentProfile.id).join(
                Post).filter(Post.id.in_(union)).order_by(
                Post.creation_date.desc()).all()
            indirect_authors = [x for (x,) in indirect_authors
                                if x not in author_ids]
            author_ids.extend(indirect_authors)
        if not author_ids:
          return []
        if id_only:
            return [AgentProfile.uri_generic(id) for id in author_ids]
        else:
            return self.db.query(AgentProfile).filter(
                AgentProfile.id.in_(author_ids)).all()

    def get_discussion_id(self):
        return self.discussion_id

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

    def get_num_children(self):
        return len(self.children)

    @property
    def is_in_next_synthesis(self):
        next_synthesis = self.discussion.get_next_synthesis()
        if not next_synthesis:
            return False
        return True if self in next_synthesis.ideas else False

    @is_in_next_synthesis.setter
    def is_in_next_synthesis(self, val):
        next_synthesis = self.discussion.get_next_synthesis()
        assert next_synthesis
        is_there = self in next_synthesis.ideas
        if val and not is_there:
            next_synthesis.ideas.append(self)
            next_synthesis.send_to_changes()
        elif is_there and not val:
            next_synthesis.ideas.remove(self)
            next_synthesis.send_to_changes()

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(connection)
        else:
            super(Idea, self).send_to_changes(connection)
        watcher = get_model_watcher()
        if operation == UPDATE_OP:
            watcher.processIdeaModified(self.id, 0)  # no versions yet.
        elif operation == DELETE_OP:
            watcher.processIdeaDeleted(self.id)
        elif operation == INSERT_OP:
            watcher.processIdeaCreated(self.id)

    def __repr__(self):
        if self.short_title:
            return "<Idea %d %s>" % (self.id or -1, repr(self.short_title))

        return "<Idea %d>" % (self.id or -1,)

    @classmethod
    def invalidate_ideas(cls, discussion_id, post_id):
        raise NotImplemented()

    @classmethod
    def get_idea_ids_showing_post(cls, post_id):
        "Given a post, give the ID of the ideas that show this message"
        # This works because of a virtuoso bug...
        # where DISTINCT gives IDs instead of URIs.
        from .generic import Content
        discussion_storage = \
            AssemblQuadStorageManager.discussion_storage_name()

        post_uri = URIRef(Content.uri_generic(
            post_id, AssemblQuadStorageManager.local_uri()))
        return [int(id) for (id,) in cls.default_db.execute(SparqlClause(
            '''select distinct ?idea where {
                %s sioc:reply_of* ?post .
                ?fragment oa:hasSource ?post .
                ?fragment assembl:resourceExpressesIdea ?ideaF .
                ?idea idea:includes* ?ideaF  }''' % (post_uri.n3(),),
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
            %s idea:includes* ?ideaF .
            ?fragment assembl:resourceExpressesIdea ?ideaF .
            ?fragment oa:hasSource ?postF .
            ?post sioc:reply_of* ?postF .
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
        ideas = cls.default_db.query(cls).filter(cls.id.in_(idea_ids))
        return [(idea.id, idea.num_read_posts_for(user_id))
                for idea in ideas]

    def get_widget_creation_urls(self):
        from .widgets import GeneratedIdeaWidgetLink
        return [wl.context_url for wl in self.widget_links
                if isinstance(wl, GeneratedIdeaWidgetLink)]

    def get_notifications(self):
        from .widgets import BaseIdeaWidgetLink
        for widget_link in self.widget_links:
            if not isinstance(self, BaseIdeaWidgetLink):
                continue
            for n in widget_link.widget.has_notification():
                yield n

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

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                parent = self.owner_alias
                children = last_alias
                return query.join(
                    IdeaLink, IdeaLink.target_id == children.id).join(
                    parent, IdeaLink.source_id == parent.id).filter(
                    IdeaLink.source_id == parent_instance.id)

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
            ancestry = text("""SELECT id from (SELECT source_id as id FROM (
                        SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                            source_id, target_id FROM idea_idea_link WHERE tombstone_date IS NULL
                        ) il
                    WHERE il.target_id = :idea_id
                    UNION SELECT :idea_id as id) recid""").columns(column('id'))

            def __init__(self, cls, widget_subclass=None):
                super(AncestorWidgetsCollectionDefinition, self).__init__(cls, Widget)
                self.widget_subclass = widget_subclass

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                parent = self.owner_alias
                widgets = last_alias
                ancestry = self.ancestry.bindparams(
                    idea_id=parent_instance.id).alias('ancestry')
                # ideally, we should be able to bind to parent.id
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
                ancestry = self.ancestry.bindparams(
                    idea_id=parent_instance.id).alias('ancestry')
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

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                idea = self.owner_alias
                return query.join(IdeaRelatedPostLink, idea)

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

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                idea = self.owner_alias
                query = query.join(IdeaContentWidgetLink).join(
                    idea,
                    IdeaContentWidgetLink.idea_id == parent_instance.id)
                if Content in chain(*(
                        mapper.entities for mapper in query._entities)):
                    query = query.options(
                        contains_eager(Content.widget_idea_links))
                        # contains_eager(Content.extracts) seems to slow things down instead
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                # This is going to spell trouble: Sometimes we'll have creator,
                # other times creator_id
                if isinstance(instance, Content):
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

        class VoteTargetsCollection(AbstractCollectionDefinition):
            # The set of voting target ideas.
            # Fake: There is no DB link here.
            def __init__(self, cls):
                super(VoteTargetsCollection, self).__init__(cls, Idea)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                assert parent_instance.has_criterion_links
                return query.filter(
                    last_alias.discussion_id == parent_instance.discussion_id
                    ).filter(last_alias.hidden==False)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx,
                    kwargs):
                for inst in assocs[:]:
                    widgets_coll = ctx.find_collection(
                        'CriterionCollection.criteria')
                    if isinstance(inst, AbstractIdeaVote):
                        other_votes = instance.db.query(AbstractIdeaVote).filter_by(
                            voter_id=user_id, idea_id=inst.idea.id,
                            criterion_id=parent_instance.id, tombstone_date=None
                            ).options(joinedload(AbstractIdeaVote.idea)).all()
                        for other_vote in other_votes:
                            if other_vote == inst:
                                # probably never happens
                                continue
                            other_vote.tombstone_date = inst.vote_date or datetime.now()
                            inst.base_id = other_vote.base_id
                        assocs.append(VotedIdeaWidgetLink(
                            widget=widgets_coll.parent_instance,
                            idea=inst.idea,
                            **self.filter_kwargs(
                                VotedIdeaWidgetLink, kwargs)))

            def contains(self, parent_instance, instance):
                return isinstance(instance, Idea)

        return {'children': ChildIdeaCollectionDefinition(cls),
                'linkedposts': LinkedPostCollectionDefinition(cls),
                'widgetposts': WidgetPostCollectionDefinition(cls),
                'ancestor_widgets': AncestorWidgetsCollectionDefinition(cls),
                'ancestor_inspiration_widgets': AncestorWidgetsCollectionDefinition(
                    cls, InspirationWidget),
                'vote_targets': VoteTargetsCollection(cls)}

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
            Post.discussion_id == self.discussion_id
        ).count()
        return int(result)

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
            source_id=self.source_id,
            target_id=self.target_id)
        return super(IdeaLink, self).copy(**kwargs)

    def get_discussion_id(self):
        if inspect(self).attrs.source_ts.loaded_value != NO_VALUE:
            return self.source_ts.get_discussion_id()
        else:
            return self.object_session.query(Idea).get(self.source_id).get_discussion_id()

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(connection)
        else:
            super(IdeaLink, self).send_to_changes(connection)

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
