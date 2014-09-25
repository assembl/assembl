from itertools import chain
from collections import defaultdict
from abc import ABCMeta, abstractmethod
import HTMLParser
from datetime import datetime

from sqlalchemy.orm import (
    relationship, backref, aliased, contains_eager, joinedload)
from sqlalchemy.orm.attributes import NO_VALUE
from sqlalchemy.sql import text
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
from virtuoso.vmapping import PatternIriClass, IriClass

from ..nlp.wordcounter import WordCounter
from . import DiscussionBoundBase
from .discussion import Discussion
from ..semantic.virtuoso_mapping import QuadMapPatternS
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
    def visit_idea(self, idea):
        pass


class IdeaLinkVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta
    @abstractmethod
    def visit_link(self, link):
        pass


class WordCountVisitor(IdeaVisitor):
    def __init__(self, lang):
        self.counter = WordCounter(lang)
        # TODO bgregoire: We can remove this when we have clean idea text
        self.parser = HTMLParser.HTMLParser()

    def visit_idea(self, idea):
        short_title = idea.short_title or ''
        self.counter.add_text(self.parser.unescape(short_title))
        self.counter.add_text(self.parser.unescape(
            idea.long_title or short_title))
        self.counter.add_text(self.parser.unescape(
            idea.definition or short_title))

    def best(self, num=8):
        return self.counter.best(num)


class Idea(DiscussionBoundBase):
    """
    A core concept taken from the associated discussion
    """
    __tablename__ = "idea"
    ORPHAN_POSTS_IDEA_ID = 'orphan_posts'
    sqla_type = Column(String(60), nullable=False)

    long_title = Column(
        UnicodeText,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.alternative)})
    short_title = Column(UnicodeText,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.title)})
    definition = Column(UnicodeText,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.description)})
    hidden = Column(Boolean, server_default='0')
    is_tombstone = Column(Boolean, server_default='0')

    id = Column(Integer, primary_key=True,
                info= {'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    creation_date = Column(
        DateTime, nullable=False, default=datetime.utcnow,
        info = {'rdf': QuadMapPatternS(None, DCTERMS.created)})

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'),
        nullable=False,
        index=True,
        info = {'rdf': QuadMapPatternS(None, SIOC.has_container)})

    discussion = relationship(
        Discussion,
        backref=backref('ideas', order_by=creation_date)
    )

    #widget_id = deferred(Column(Integer, ForeignKey('widget.id')))
    #widget = relationship("Widget", backref=backref('ideas', order_by=creation_date))

    __mapper_args__ = {
        'polymorphic_identity': 'idea:GenericIdeaNode',
        'polymorphic_on': sqla_type,
        # Not worth it for now, as the only other class is RootIdea, and there
        # is only one per discussion - benoitg 2013-12-23
        #'with_polymorphic': '*'
    }

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(None,
            RDF.type, IriClass(VirtRDF.QNAME_ID).apply(Idea.sqla_type),
            name=QUADNAMES.class_Idea_class)]

    @property
    def children(self):
        return [cl.target for cl in self.target_links]

    @property
    def parents(self):
        return [cl.source for cl in self.source_links]

    @property
    def widget_add_post_endpoint(self):
        return {
            widget.uri(): widget.get_add_post_endpoint(self)
            for widget in self.widgets
            if getattr(widget, 'get_add_post_endpoint', None)
        }

    def get_all_ancestors(self):
        """ Get all ancestors of this idea by following source links.  
        This is naive and slow, but not used very much for now.
        TODO:  Rewrite once we migrate to virtuoso"""
        sql = '''SELECT * FROM idea JOIN (
                  SELECT source_id FROM (
                    SELECT transitive t_in (1) t_out (2) t_distinct T_NO_CYCLES
                        source_id, target_id FROM idea_idea_link WHERE is_tombstone=0) ia
                  JOIN idea AS dag_idea ON (ia.source_id = dag_idea.id)
                  WHERE dag_idea.discussion_id = :discussion_id
                  AND ia.target_id=:idea_id) x on (id=source_id)'''
        ancestors = self.db().query(Idea).from_statement(text(sql).bindparams(
            discussion_id= self.discussion_id, idea_id= self.id))

        return ancestors.all()
    
    def get_order_from_first_parent(self):
        return self.source_links[0].order if self.source_links else None

    def get_first_parent_uri(self):
        return Idea.uri_generic(
            self.source_links[0].source_id
        ) if self.source_links else None

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
                        source_id, target_id FROM idea_idea_link WHERE is_tombstone=0
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
             AND idea.is_tombstone = 0 AND idea.hidden = 0)"""

    @staticmethod
    def _get_count_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return "SELECT COUNT(post_id) as total_count from (%s) orphans" % (
            Idea._get_orphan_posts_statement())

    @staticmethod
    def _get_orphan_posts_statement():
        """ Requires discussion_id bind parameters """
        return Idea._get_orphan_posts_statement_no_select("SELECT post.id as post_id")

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
        connection = self.db().connection()
        user_id = connection.info.get('userid', None)
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
        pass  #TODO

    def visit_ideas_depth_first(self, idea_visitor):
        self.prefetch_descendants()
        self._visit_ideas_depth_first(idea_visitor, set())

    def _visit_ideas_depth_first(self, idea_visitor, visited):
        if self in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = idea_visitor.visit_idea(self)
        visited.add(self)
        if result is not IdeaVisitor.CUT_VISIT:
            for child in self.children:
                child._visit_ideas_depth_first(idea_visitor, visited)

    def visit_ideas_breadth_first(self, idea_visitor):
        self.prefetch_descendants()
        result = idea_visitor.visit_idea(self)
        visited = {self}
        if result is not IdeaVisitor.CUT_VISIT:
            self._visit_ideas_breadth_first(idea_visitor, visited)

    def _visit_ideas_breadth_first(self, idea_visitor, visited):
        children = []
        for child in self.children:
            if child in visited:
                continue
            result = idea_visitor.visit_idea(child)
            visited.add(child)
            if result != IdeaVisitor.CUT_VISIT:
                children.append(child)
        for child in children:
            child._visit_ideas_breadth_first(idea_visitor, visited)

    def most_common_words(self, lang=None, num=8):
        if not lang:
            # TODO: Is there a better way to do this than get_current_registry?
            from pyramid.threadlocal import get_current_registry
            lang = get_current_registry().settings.get(
                'pyramid.default_locale_name', 'fr')
        word_counter = WordCountVisitor(lang)
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
            for criterion, votes in latest_by_criterion.iteritems()
        }

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    @classmethod
    def base_condition(cls):
        return cls.is_tombstone == False

    def get_num_children(self):
        return len(self.children)

    def is_in_next_synthesis(self):
        next_synthesis = self.discussion.get_next_synthesis()
        if not next_synthesis: return False
        return True if self in next_synthesis.ideas else False

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        connection = connection or self.db().connection()
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
    def idea_counts(cls, discussion_id, post_id, user_id):
        "Given a post and a user, give the total and read count of posts for each affected idea"
        stmt1 = """SELECT idea.id, root_post.id FROM idea 
            JOIN idea_content_link ON (idea_content_link.idea_id = idea.id)
            JOIN idea_content_positive_link
                ON (idea_content_positive_link.id = idea_content_link.id)
            JOIN post AS root_post ON (idea_content_link.content_id = root_post.id)
            WHERE root_post.id = :post_id OR root_post.id IN
            (SELECT parent_id, id FROM (
                    SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                        parent_id, id FROM post
                    UNION SELECT id AS parent_id, id FROM POST
                    ) pa 
                JOIN content USING (id) WHERE id = :post_id AND content.discussion_id = :discussion_id)"""
        roots = defaultdict(set)
        for idea_id, post_id in cls.db().execute(text(stmt1).params(
            {'post_id': post_id,
             "discussion_id": discussion_id})):
            roots[idea_id].add(post_id)
        result = []
        common_params = dict(discussion_id=discussion_id, user_id=user_id)
        for idea_id, post_ids in roots.iteritems():
            stmt2 = ' UNION '.join([
                """SELECT  pa.id as post_id FROM (
                    SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                        parent_id, id FROM post
                    UNION SELECT id AS parent_id, id FROM POST
                    ) pa 
                WHERE parent_id = :post_id_%d
                """ % n for n in range(len(post_ids))])
            # We have to specify distinct to avoid counting nulls. Go figure.
            stmt2 = """SELECT COUNT(DISTINCT x.post_id),
                COUNT(DISTINCT action.id) FROM (%s) x
                LEFT JOIN action_on_post ON (
                     action_on_post.post_id = x.post_id)
                LEFT JOIN action ON (action.actor_id = :user_id
                        AND action.id = action_on_post.id
                        AND action.type = 'version:ReadStatusChange')""" % (stmt2,)
            params = {'post_id_'+str(n): post_id for n, post_id in enumerate(post_ids)}
            params['user_id'] = user_id
            cpost, cview = list(cls.db().execute(text(stmt2).params(params))).pop()
            result.append((idea_id, cpost, cview))
        stmt3 = """SELECT MIN(root_idea.id) as idea_id,
            COUNT(DISTINCT post.id) as total_count,
            COUNT(DISTINCT action_on_post.id) as read_count
            FROM root_idea
            JOIN idea ON (idea.id = root_idea.id)
            CROSS JOIN post
            JOIN content ON (post.id = content.id)
            LEFT JOIN action ON (action.actor_id = :user_id)
            LEFT JOIN action_on_post ON (
                action.id = action_on_post.id AND action_on_post.post_id = post.id)
            WHERE idea.discussion_id = :discussion_id
            AND content.discussion_id = :discussion_id"""
        result.append(list(cls.db().execute(text(stmt3).params(common_params))).pop())
        return result

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
        return cls.db().query(
            IdeaLink).join(
                source, source.id == IdeaLink.source_id).join(
                    target, target.id == IdeaLink.target_id).filter(
                        target.discussion_id == discussion_id).filter(
                            source.discussion_id == discussion_id).filter(
                                IdeaLink.is_tombstone == False).all()

    @classmethod
    def extra_collections(cls):
        from .votes import AbstractIdeaVote
        from .widgets import VotedIdeaWidgetLink
        from .idea_content_link import IdeaRelatedPostLink, IdeaContentWidgetLink
        from .generic import Content

        class ChildIdeaCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(ChildIdeaCollectionDefinition, self).__init__(cls, Idea)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                parent = self.owner_alias
                children = last_alias
                return query.join(IdeaLink, IdeaLink.target_id == children.id).join(
                    parent, IdeaLink.source_id == parent.id).filter(
                    IdeaLink.source_id == parent_instance.id)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                if isinstance(instance, Idea):
                    assocs.append(IdeaLink(
                            source=parent_instance, target=instance,
                            **self.filter_kwargs(
                                IdeaLink, kwargs)))

            def contains(self, parent_instance, instance):
                return IdeaLink.db.query(
                    IdeaLink).filter_by(
                        source=parent_instance, target=instance
                    ).count() > 0

        class LinkedPostCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(LinkedPostCollectionDefinition, self).__init__(cls, Content)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                idea = self.owner_alias
                return query.join(IdeaRelatedPostLink, idea)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
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
                return IdeaRelatedPostLink.db.query(
                    IdeaRelatedPostLink).filter_by(
                        content=instance, idea=parent_instance
                    ).count() > 0

        class WidgetPostCollectionDefinition(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(WidgetPostCollectionDefinition, self).__init__(cls, Content)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                idea = self.owner_alias
                query = query.join(IdeaContentWidgetLink).join(
                    idea,
                    IdeaContentWidgetLink.idea_id == parent_instance.id)
                if Content in chain(*(mapper.entities for mapper in query._entities)):
                    query = query.options(
                        contains_eager(Content.widget_idea_links))
                        # contains_eager(Content.extracts) seems to slow things down instead
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
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
                return IdeaContentWidgetLink.db.query(
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
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                for inst in assocs[:]:
                    widgets_coll = ctx.find_collection('CriterionCollection.criteria')
                    if isinstance(inst, AbstractIdeaVote):
                        other_votes = cls.db.query(AbstractIdeaVote).filter_by(
                            voter_id=user_id, idea_id = inst.idea.id,
                            criterion_id=parent_instance.id, is_tombstone=False
                            ).options(joinedload(AbstractIdeaVote.idea)).all()
                        for other_vote in other_votes:
                            if other_vote == inst:
                                # probably never happens
                                continue
                            other_vote.is_tombstone = True
                        assocs.append(VotedIdeaWidgetLink(
                            widget=widgets_coll.parent_instance, idea=inst.idea,
                            **self.filter_kwargs(
                                VotedIdeaWidgetLink, kwargs)))

            def contains(self, parent_instance, instance):
                return isinstance(instance, Idea)

        return {'children': ChildIdeaCollectionDefinition(cls),
                'linkedposts': LinkedPostCollectionDefinition(cls),
                'widgetposts': WidgetPostCollectionDefinition(cls),
                'vote_targets': VoteTargetsCollection(cls)}

    crud_permissions = CrudPermissions(
            P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_ADMIN_DISC,
            P_ADMIN_DISC, P_ADMIN_DISC)

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

    root_for_discussion = relationship(
        Discussion,
        backref=backref('root_idea', uselist=False),
    )

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:RootIdea',
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


class Issue(Idea):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:Issue',
    }


class Position(Idea):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:Position',
    }


class Argument(Idea):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:Argument',
    }


class Criterion(Idea):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:Criterion',
    }


class IdeaLink(DiscussionBoundBase):
    """
    A generic link between two ideas

    If a parent-child relation, the parent is the source, the child the target.
    Beware: it's reversed in the RDF model. We will change things around.
    """
    __tablename__ = 'idea_idea_link'
    rdf_class = IDEA.InclusionRelation
    id = Column(Integer, primary_key=True,
                info= {'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    sqla_type = Column(String(60), nullable=False, default="idea:InclusionRelation")
    source_id = Column(Integer, ForeignKey(
            'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info= {'rdf': QuadMapPatternS(None, IDEA.target_idea)})
    target_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info= {'rdf': QuadMapPatternS(None, IDEA.source_idea)})
    source = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.source_id, "
                        "IdeaLink.is_tombstone==False, "
                        "Idea.is_tombstone==False)",
        backref=backref('target_links', cascade="all, delete-orphan"),
        foreign_keys=(source_id))
    target = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.target_id, "
                        "IdeaLink.is_tombstone==False, "
                        "Idea.is_tombstone==False)",
        backref=backref('source_links', cascade="all, delete-orphan"),
        foreign_keys=(target_id))
    order = Column(Float, nullable=False, default=0.0,
        info= {'rdf': QuadMapPatternS(None, ASSEMBL.link_order)})
    is_tombstone = Column(Boolean, nullable=False, default=False, index=True)

    __mapper_args__ = {
        'polymorphic_identity': 'idea:InclusionRelation',
        'polymorphic_on': sqla_type,
        'with_polymorphic': '*'
    }

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(
            Idea.iri_class().apply(cls.source_id),
            IDEA.includes,
            Idea.iri_class().apply(cls.target_id),
            name=QUADNAMES.idea_inclusion_reln)]

    def copy(self):
        retval = self.__class__(source_id=self.source_id,
                                target_id=self.target_id,
                                is_tombstone=self.is_tombstone
                                )
        self.db.add(retval)
        return retval

    def get_discussion_id(self):
        if inspect(self).attrs.source.loaded_value != NO_VALUE:
            return self.source.get_discussion_id()
        else:
            return Idea.get(id=self.source_id).get_discussion_id()

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        connection = connection or self.db().connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(connection)
        else:
            super(IdeaLink, self).send_to_changes(connection)

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return (cls.source_id == Idea.id) & (Idea.discussion_id == discussion_id)

    @classmethod
    def base_condition(cls):
        return cls.is_tombstone == False

    crud_permissions = CrudPermissions(
            P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA,
            P_EDIT_IDEA, P_EDIT_IDEA)


class PositionRespondsToIssue(IdeaLink):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:PositionRespondsToIssue',
    }


class ArgumentSupportsIdea(IdeaLink):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:ArgumentSupportsIdea',
    }


class ArgumentOpposesIdea(IdeaLink):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:ArgumentOpposesIdea',
    }


class IssueAppliesTo(IdeaLink):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:IssueAppliesTo',
    }


class IssueQuestions(IssueAppliesTo):
    __mapper_args__ = {
        'polymorphic_identity': 'ibis:IssueQuestions',
    }

