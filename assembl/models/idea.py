# -*- coding: utf-8 -*-
"""Defining the idea and links between ideas."""

from itertools import chain
from collections import defaultdict
from abc import ABCMeta, abstractmethod
from datetime import datetime
from enum import Enum

from ..lib.clean_input import sanitize_text
from sqlalchemy.orm import relationship, backref, aliased, contains_eager, column_property, with_polymorphic
from sqlalchemy.sql.expression import bindparam, literal_column

from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    select,
    func,
)
from sqlalchemy.ext.associationproxy import association_proxy
from pyramid.i18n import TranslationStringFactory

from ..nlp.wordcounter import WordCounter
from . import DiscussionBoundBase, HistoryMixin
from .discussion import Discussion
from .langstrings import LangString
from ..auth import (
    CrudPermissions, P_READ, P_ADMIN_DISC, P_EDIT_IDEA,
    P_ADD_IDEA)
from ..lib.sqla import CrudOperation
from ..lib.model_watcher import get_model_watcher
from assembl.views.traversal import (
    AbstractCollectionDefinition, CollectionDefinition)

from sqlalchemy.types import TIMESTAMP as Timestamp


_ = TranslationStringFactory('assembl')


class MessageView(Enum):
    multiColumns = 'multiColumns'
    brightMirror = 'brightMirror'


class defaultdictlist(defaultdict):
    """A defaultdict of lists."""

    def __init__(self):
        super(defaultdictlist, self).__init__(list)


class IdeaVisitor(object):
    """A Visitor_ for the structure of :py:class:`Idea`

    The visit is started by :py:meth:`Idea.visit_ideas_depth_first`,
    :py:meth:`Idea.visit_ideas_breadth_first` or
    :py:meth:`Idea.visit_idea_ids_depth_first`

    .. _Visitor: https://sourcemaking.com/design_patterns/visitor
    """
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_idea(self, idea, level, prev_result):
        pass

    def end_visit(self, idea, level, result, child_results):
        return result


class IdeaLinkVisitor(object):
    """A Visitor for the structure of :py:class:`IdeaLink`"""
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_link(self, link):
        pass


class AppendingVisitor(IdeaVisitor):
    """A Visitor that appends visit results to a list"""

    def __init__(self):
        self.ideas = []

    def visit_idea(self, idea, level, prev_result):
        self.ideas.append(idea)
        return self.ideas


class WordCountVisitor(IdeaVisitor):
    """A Visitor that counts words related to an idea"""

    def __init__(self, langs, count_posts=True):
        self.counter = WordCounter(langs)
        self.count_posts = True

    def cleantext(self, text):
        return sanitize_text(text)

    def visit_idea(self, idea, level, prev_result):
        if idea.short_title:
            self.counter.add_text(self.cleantext(idea.short_title), 2)
        if idea.long_title:
            self.counter.add_text(self.cleantext(idea.long_title))
        if idea.definition:
            self.counter.add_text(self.cleantext(idea.definition))
        if self.count_posts and level == 0:
            from .generic import Content
            query = idea.db.query(Content)
            related = idea.get_related_posts_query(True)
            query = query.join(related, Content.id == related.c.post_id
                ).filter(Content.hidden == False,  # noqa: E712
                         Content.tombstone_condition()).options(
                    Content.subqueryload_options())
            titles = set()
            # TODO maparent: Group langstrings by language.
            for content in query:
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
    An idea (or concept) distilled from the conversation flux.
    """
    __tablename__ = "idea"
    ORPHAN_POSTS_IDEA_ID = 'orphan_posts'
    sqla_type = Column(String(60), nullable=False)
    rdf_type = Column(
        String(60), nullable=False, server_default='idea:GenericIdeaNode')

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    synthesis_title_id = Column(
        Integer(), ForeignKey(LangString.id))
    description_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("idea_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")
    synthesis_title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=synthesis_title_id == LangString.id,
        backref=backref("idea_from_synthesis_title", lazy="dynamic"),
        cascade="all, delete-orphan")
    description = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=description_id == LangString.id,
        backref=backref("idea_from_description", lazy="dynamic"),
        cascade="all, delete-orphan")
    hidden = Column(Boolean, server_default='0')
    last_modified = Column(Timestamp)
    # TODO: Make this autoupdate on change. see
    # http://stackoverflow.com/questions/1035980/update-timestamp-when-row-is-updated-in-postgresql

    # temporary placeholders
    @property
    def definition(self):
        if self.description_id:
            return self.description.first_original().value
        return ""

    @property
    def long_title(self):
        if self.synthesis_title_id:
            return self.synthesis_title.first_original().value
        return ""

    @property
    def short_title(self):
        if self.title_id:
            return self.title.first_original().value
        return ""

    messages_in_parent = Column(
        Boolean, default=True, server_default='true',
        doc="are messages in this idea also part of the parent idea?")

    message_view_override = Column(
        String(100), doc="Use a non-standard view for this idea")

    creation_date = Column(
        DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'),
        nullable=False,
        index=True)

    discussion = relationship(
        Discussion,
        backref=backref(
            'ideas', order_by=creation_date,
            primaryjoin="and_(Idea.discussion_id==Discussion.id, "
                        "Idea.tombstone_date == None)")
    )

    discussion_ts = relationship(
        Discussion,
        backref=backref(
            'ideas_ts', order_by=creation_date,
            cascade="all, delete-orphan")
    )

    # widget_id = deferred(Column(Integer, ForeignKey('widget.id')))
    # widget = relationship("Widget", backref=backref('ideas', order_by=creation_date))

    __mapper_args__ = {
        'polymorphic_identity': 'idea',
        'polymorphic_on': sqla_type,
        # Not worth it for now, as the only other class is RootIdea, and there
        # is only one per discussion - benoitg 2013-12-23
        # 'with_polymorphic': '*'
    }

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
        return self.db.query(Idea
            ).join(IdeaLink, (IdeaLink.target_id == Idea.id) & (IdeaLink.tombstone_date == None)  # noqa: E711
            ).filter((IdeaLink.source_id == self.id) & (Idea.tombstone_date == None)
            ).order_by(IdeaLink.order).all()

    def get_parents(self):
        return self.db.query(Idea
            ).join(IdeaLink, (IdeaLink.source_id == Idea.id) & (IdeaLink.tombstone_date == None)  # noqa: E711
            ).filter((IdeaLink.target_id == self.id) & (Idea.tombstone_date == None)  # noqa: E711
            ).all()

    def safe_title(self, user_prefs, localizer=None):
        if self.title:
            entry = self.title.best_lang(user_prefs)
            if entry:
                return entry.value
        # absurd fallback
        text = _("Idea")
        if localizer:
            text = localizer.translate(text)
        return " ".join((text, str(self.id)))

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

    def copy(self, tombstone=None, db=None, **kwargs):
        if tombstone is True:
            tombstone = datetime.utcnow()
        kwargs.update(
            tombstone=tombstone,
            hidden=self.hidden,
            creation_date=self.creation_date,
            discussion=self.discussion,
            title=self.title.clone(db=db) if self.title else None,
            synthesis_title=self.synthesis_title.clone(db=db) if self.synthesis_title else None,
            description=self.description.clone(db=db) if self.description else None)

        return super(Idea, self).copy(db=db, **kwargs)

    @classmethod
    def get_ancestors_query_cls(
            cls, target_id=bindparam('root_id', type_=Integer),
            inclusive=True, tombstone_date=None):
        if isinstance(target_id, list):
            root_condition = IdeaLink.target_id.in_(target_id)
        else:
            root_condition = (IdeaLink.target_id == target_id)
        link = select(
            [IdeaLink.source_id, IdeaLink.target_id]
            ).select_from(
                IdeaLink
            ).where(
                (IdeaLink.tombstone_date == tombstone_date) &
                (root_condition)
            ).cte(recursive=True)
        target_alias = aliased(link)
        sources_alias = aliased(IdeaLink)
        parent_link = sources_alias.target_id == target_alias.c.source_id
        parents = select(
            [sources_alias.source_id, sources_alias.target_id]
            ).select_from(sources_alias).where(
                parent_link & (sources_alias.tombstone_date == tombstone_date))
        with_parents = link.union(parents)
        select_exp = select([with_parents.c.source_id.label('id')]
            ).select_from(with_parents)
        if inclusive:
            if isinstance(target_id, (int, long)):
                target_id = literal_column(str(target_id), Integer)
            elif isinstance(target_id, list):
                raise NotImplemented()
                # postgres: select * from unnest(ARRAY[1,6,7]) as id
            else:
                select_exp = select_exp.union(
                    select([target_id.label('id')]))
        return select_exp.alias('ancestors')

    def get_ancestors_query(
            self, inclusive=True, tombstone_date=None, subquery=True):
        select_exp = self.get_ancestors_query_cls(
            self.id, inclusive=inclusive, tombstone_date=tombstone_date)
        if subquery:
            select_exp = self.db.query(select_exp).subquery()
        return select_exp

    def get_all_ancestors(self, id_only=False):
        query = self.get_ancestors_query(
            tombstone_date=self.tombstone_date, subquery=not id_only)
        if id_only:
            return list((id for (id,) in self.db.query(query)))
        else:
            return self.db.query(Idea).filter(Idea.id.in_(query)).all()

    def get_associated_phase(self):
        from .timeline import Phases, get_phase_by_identifier
        query = self.get_ancestors_query(
            tombstone_date=self.tombstone_date, subquery=True)
        res = self.db.query(Idea).filter(Idea.id.in_(query)
            ).join(Idea.discussion_phase
            ).options(contains_eager(Idea.discussion_phase)).all()
        root_idea = res[0] if res else None
        if root_idea:
            return root_idea.discussion_phase

        return get_phase_by_identifier(self.discussion or Discussion.get(self.discussion_id), Phases.thread.value)

    def get_applicable_announcement(self):
        from .announcement import IdeaAnnouncement
        if self.announcement:
            return self.announcement
        aq = self.get_ancestors_query()
        announcements = self.db.query(IdeaAnnouncement
            ).filter(IdeaAnnouncement.idea_id.in_(aq),
                     IdeaAnnouncement.should_propagate_down == True  # noqa: E712
            ).all()
        # assume order is preserved from aq...
        if announcements:
            return announcements[-1]

    @classmethod
    def get_descendants_query_cls(
            cls, root_idea_id=bindparam('root_idea_id', type_=Integer),
            inclusive=True):
        link = select(
            [IdeaLink.source_id, IdeaLink.target_id]
            ).select_from(
                IdeaLink
            ).where(
                (IdeaLink.tombstone_date == None) & (IdeaLink.source_id == root_idea_id)  # noqa: E711
            ).cte(recursive=True)
        source_alias = aliased(link)
        targets_alias = aliased(IdeaLink)
        parent_link = targets_alias.source_id == source_alias.c.target_id
        children = select(
            [targets_alias.source_id, targets_alias.target_id]
            ).select_from(targets_alias).where(parent_link & (targets_alias.tombstone_date == None))  # noqa: E711
        with_children = link.union(children)
        select_exp = select([with_children.c.target_id.label('id')]
            ).select_from(with_children)
        if inclusive:
            if isinstance(root_idea_id, int):
                root_idea_id = literal_column(str(root_idea_id), Integer)
            select_exp = select_exp.union(
                select([root_idea_id.label('id')]))
        return select_exp.alias('descendants')

    def get_descendants_query(
            self, inclusive=True, subquery=True):
        select_exp = self.get_descendants_query_cls(self.id, inclusive=inclusive)
        if subquery:
            select_exp = self.db.query(select_exp).subquery()
        return select_exp

    def get_all_descendants(self, id_only=False, inclusive=True):
        query = self.get_descendants_query(
            inclusive=inclusive, subquery=not id_only)
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

    def propagate_message_count(self):
        return True  # self.messages_in_parent

    @classmethod
    def get_related_posts_query_c(
            cls, discussion_id, root_idea_id, partial=False,
            include_deleted=False):
        from .generic import Content
        counters = cls.prepare_counters(discussion_id)
        if partial:
            return counters.paths[root_idea_id].as_clause_base(
                cls.default_db(), include_deleted=include_deleted)
        else:
            return counters.paths[root_idea_id].as_clause(
                cls.default_db(), discussion_id, counters.user_id, Content,
                include_deleted=include_deleted)

    @classmethod
    def get_discussion_data(cls, discussion_id):
        from pyramid.threadlocal import get_current_request
        from .path_utils import DiscussionGlobalData
        req = get_current_request()
        discussion_data = None
        if req:
            discussion_data = getattr(req, "discussion_data", None)
        if not discussion_data:
            discussion_data = DiscussionGlobalData(
                cls.default_db(), discussion_id,
                req.authenticated_userid if req else None)
            if req:
                req.discussion_data = discussion_data
        return discussion_data

    @classmethod
    def prepare_counters(cls, discussion_id, calc_all=False):
        discussion_data = cls.get_discussion_data(discussion_id)
        return discussion_data.post_path_counter(
            discussion_data.user_id, calc_all)

    def get_related_posts_query(self, partial=False, include_deleted=False):
        return self.get_related_posts_query_c(
            self.discussion_id, self.id, partial,
            include_deleted=include_deleted)

    @classmethod
    def _get_orphan_posts_statement(
            cls, discussion_id, get_read_status=False, content_alias=None,
            include_deleted=False):
        """ Requires discussion_id bind parameters
        Excludes synthesis posts """
        counters = cls.prepare_counters(discussion_id)
        return counters.orphan_clause(
            counters.user_id if get_read_status else None,
            content_alias, include_deleted=include_deleted)

    @property
    def num_posts(self):
        counters = self.prepare_counters(self.discussion_id)
        return counters.get_counts(self.id)[0]

    @property
    def num_contributors(self):
        counters = self.prepare_counters(self.discussion_id)
        return counters.get_counts(self.id)[1]

    @property
    def num_read_posts(self):
        counters = self.prepare_counters(self.discussion_id)
        return counters.get_counts(self.id)[2]

    @property
    def num_total_and_read_posts(self):
        counters = self.prepare_counters(self.discussion_id)
        return counters.get_counts(self.id)

    def prefetch_descendants(self):
        # TODO maparent: descendants only. Let's just prefetch all ideas.
        ideas = self.db.query(Idea).filter_by(
            discussion_id=self.discussion_id, tombstone_date=None).all()
        ideas_by_id = {idea.id: idea for idea in ideas}
        children_id_dict = self.children_dict(self.discussion_id)
        return {
            id: [ideas_by_id[child_id] for child_id in child_ids]
            for (id, child_ids) in children_id_dict.iteritems()
        }

    def visit_ideas_depth_first(self, idea_visitor):
        children_dict = self.prefetch_descendants()
        return self._visit_ideas_depth_first(idea_visitor, set(), 0, None, children_dict)

    def _visit_ideas_depth_first(
            self, idea_visitor, visited, level, prev_result, children_dict):
        if self in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = idea_visitor.visit_idea(self, level, prev_result)
        visited.add(self)
        child_results = []
        if result is not IdeaVisitor.CUT_VISIT:
            for child in children_dict.get(self.id, ()):
                r = child._visit_ideas_depth_first(
                    idea_visitor, visited, level + 1, result, children_dict)
                if r:
                    child_results.append((child, r))
        return idea_visitor.end_visit(self, level, result, child_results)

    @classmethod
    def children_dict(cls, discussion_id):
        # We do not want a subclass
        cls = [c for c in cls.mro() if c.__name__ == "Idea"][0]
        source = aliased(cls, name="source")
        target = aliased(cls, name="target")
        link_info = list(cls.default_db.query(
            IdeaLink.target_id, IdeaLink.source_id
        ).join(source, source.id == IdeaLink.source_id
        ).join(target, target.id == IdeaLink.target_id
        ).filter(
            source.discussion_id == discussion_id,
            IdeaLink.tombstone_date == None,  # noqa: E711
            source.tombstone_date == None,  # noqa: E711
            target.tombstone_date == None,  # noqa: E711
            target.discussion_id == discussion_id
        ).order_by(IdeaLink.order))
        if not link_info:
            (root_id,) = cls.default_db.query(
                RootIdea.id).filter_by(discussion_id=discussion_id).first()
            return {None: (root_id,), root_id: ()}
        child_nodes = {child for (child, parent) in link_info}
        children_of = defaultdict(list)
        for (child, parent) in link_info:
            children_of[parent].append(child)
        root = set(children_of.keys()) - child_nodes
        assert len(root) == 1
        children_of[None] = [root.pop()]
        return children_of

    @classmethod
    def visit_idea_ids_depth_first(
            cls, idea_visitor, discussion_id, children_dict=None):
        # Lightweight descent
        if children_dict is None:
            children_dict = cls.children_dict(discussion_id)
        root_id = children_dict[None][0]
        return cls._visit_idea_ids_depth_first(
            root_id, idea_visitor, children_dict, set(), 0, None)

    @classmethod
    def _visit_idea_ids_depth_first(
            cls, idea_id, idea_visitor, children_dict, visited,
            level, prev_result):
        if idea_id in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = idea_visitor.visit_idea(idea_id, level, prev_result)
        visited.add(idea_id)
        child_results = []
        if result is not IdeaVisitor.CUT_VISIT:
            for child_id in children_dict[idea_id]:
                r = cls._visit_idea_ids_depth_first(
                    child_id, idea_visitor, children_dict, visited, level + 1, result)
                if r:
                    child_results.append((child_id, r))
        return idea_visitor.end_visit(idea_id, level, result, child_results)

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
                    child_results.append((child, result))
        for child in children:
            child._visit_ideas_breadth_first(
                idea_visitor, visited, level + 1, result)
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
        subquery = self.get_descendants_query()
        query = self.db.query(
            Post.creator_id
            ).join(Extract
            ).join(subquery, Extract.idea_id == subquery.c.id
            ).filter(Extract.important == True  # noqa: E712
            ).group_by(Post.creator_id
            ).order_by(count(Extract.id).desc())
        if id_only:
            return [AgentProfile.uri_generic(a) for (a,) in query]
        else:
            ids = [x for (x,) in query]
            if not ids:
                return []
            agents = {a.id: a for a in self.db.query(AgentProfile).filter(
                AgentProfile.id.in_(ids))}
            return [agents[id] for id in ids]

    def get_contributors_query(self):
        from .generic import Content
        from .post import Post
        from sqlalchemy.sql.functions import count
        related = self.get_related_posts_query(True)
        content = with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)
        post = with_polymorphic(
            Post, [], Post.__table__,
            aliased=False, flat=True)
        query = self.db.query(post.creator_id
            ).join(content, post.id == content.id
            ).join(related, content.id == related.c.post_id
            ).filter(content.hidden == False, content.discussion_id == self.discussion_id  # noqa: E712
            ).group_by(
                post.creator_id
            ).order_by(
                count(post.id.distinct()).desc())
        return query

    def get_contributors(self):
        query = self.get_contributors_query()
        return ['local:AgentProfile/' + str(i) for (i,) in query]

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    def get_definition_preview(self):
        definition = self.definition or ""
        body = definition.strip()
        target_len = 120
        shortened = False
        html_len = 2 * target_len
        while True:
            text = sanitize_text(body[:html_len])
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

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        """invoke the modelWatcher on creation"""
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(
                connection, CrudOperation.DELETE, discussion_id, view_def)
        else:
            super(Idea, self).send_to_changes(
                connection, operation, discussion_id, view_def)
        watcher = get_model_watcher()
        if operation == CrudOperation.UPDATE:
            watcher.processIdeaModified(self.id, 0)  # no versions yet.
        elif operation == CrudOperation.DELETE:
            watcher.processIdeaDeleted(self.id)
        elif operation == CrudOperation.CREATE:
            watcher.processIdeaCreated(self.id)

    def __repr__(self):
        r = super(Idea, self).__repr__()
        title = self.short_title or ""
        return r[:-1] + title.encode("ascii", "ignore") + ">"

    @classmethod
    def invalidate_ideas(cls, discussion_id, post_id):
        raise NotImplemented()

    @classmethod
    def get_idea_ids_showing_post(cls, post_id):
        "Given a post, give the ID of the ideas that show this message"
        from sqlalchemy.sql.functions import func
        from .idea_content_link import IdeaContentPositiveLink
        from .post import Post
        (ancestry, discussion_id, idea_link_ids) = cls.default_db.query(
            Post.ancestry, Post.discussion_id,
            func.idea_content_links_above_post(Post.id)
            ).filter(Post.id == post_id).first()
        post_path = "%s%d," % (ancestry, post_id)
        if not idea_link_ids:
            return []
        idea_link_ids = [int(id) for id in idea_link_ids.split(',') if id]
        # This could be combined with previous in postgres.
        root_ideas = cls.default_db.query(
            IdeaContentPositiveLink.idea_id.distinct()
            ).filter(
                IdeaContentPositiveLink.idea_id != None,  # noqa: E711
                IdeaContentPositiveLink.id.in_(idea_link_ids)).all()
        if not root_ideas:
            return []
        root_ideas = [x for (x,) in root_ideas]
        discussion_data = cls.get_discussion_data(discussion_id)
        counter = cls.prepare_counters(discussion_id)
        idea_contains = {}
        for root_idea_id in root_ideas:
            for idea_id in discussion_data.idea_ancestry(root_idea_id):
                if idea_id in idea_contains:
                    break
                idea_contains[idea_id] = counter.paths[idea_id].includes_post(post_path)
        ideas = [id for (id, incl) in idea_contains.iteritems() if incl]
        return ideas

    @classmethod
    def idea_read_counts(cls, discussion_id, post_id, user_id):
        """Given a post and a user, give the total and read count
            of posts for each affected idea"""
        idea_ids = cls.get_idea_ids_showing_post(post_id)
        if not idea_ids:
            return []
        ideas = cls.default_db.query(cls).filter(cls.id.in_(idea_ids))
        return [(idea.id, idea.num_read_posts)
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
            IdeaLink.tombstone_date == None).all()  # noqa: E711

    @classmethod
    def extra_collections(cls):
        from .widgets import Widget, IdeaWidgetLink, InspirationWidget
        from .idea_content_link import (
            IdeaRelatedPostLink, IdeaContentWidgetLink)
        from .generic import Content
        from .post import Post
        from ..views.traversal import NsDictCollection
        from assembl.models import IdeaMessageColumn, ColumnSynthesisPost

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
                    IdeaLink.tombstone_date == None,  # noqa: E711
                    children.tombstone_date == None)  # noqa: E711

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

        class ColumnCollectionDefinition(CollectionDefinition):
            def __init__(self, cls):
                super(ColumnCollectionDefinition, self).__init__(
                    cls, cls.message_columns)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                if isinstance(instance, IdeaMessageColumn):
                    synthesis = ColumnSynthesisPost(
                        message_classifier=instance.message_classifier,
                        discussion_id=parent_instance.discussion_id,
                        subject=LangString.EMPTY(),
                        body=LangString.EMPTY()
                    )
                    idea_post_link = IdeaRelatedPostLink(
                        creator_id=user_id,
                        content=synthesis,
                        idea=parent_instance
                    )

                    assocs.append(synthesis)
                    assocs.append(idea_post_link)

        class AncestorWidgetsCollectionDefinition(AbstractCollectionDefinition):
            # For widgets which represent general configuration.

            def __init__(self, cls, widget_subclass=None):
                super(AncestorWidgetsCollectionDefinition, self).__init__(cls, Widget)
                self.widget_subclass = widget_subclass

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                parent = owner_alias
                ancestry = parent_instance.get_ancestors_query()
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
                if isinstance(instance, Post):
                    assocs.append(
                        IdeaContentWidgetLink(
                            content=instance, widget=parent_instance,
                            creator=instance.creator,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))

            def contains(self, parent_instance, instance):
                ancestors = aliased(Idea)
                iwlink = aliased(IdeaWidgetLink)
                ancestry = parent_instance.get_ancestors_query()
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
                from .post import WidgetPost
                from .attachment import Document, PostAttachment
                if isinstance(instance, Post):
                    assocs.append(
                        IdeaRelatedPostLink(
                            content=instance, idea=parent_instance,
                            creator=instance.creator,
                            **self.filter_kwargs(
                                IdeaRelatedPostLink, kwargs)))
                if isinstance(instance, WidgetPost):
                    insp_url = instance.metadata_json.get('inspiration_url', '')
                    if insp_url.startswith("https://www.youtube.com/"):
                        # TODO: detect all video/image inspirations.
                        # Handle duplicates in docs!
                        doc = Document(
                            discussion=instance.discussion,
                            uri_id=insp_url)
                        doc = doc.handle_duplication()
                        att = PostAttachment(
                            discussion=instance.discussion,
                            creator=instance.creator,
                            document=doc,
                            attachmentPurpose='EMBED_ATTACHMENT',
                            post=instance)
                        assocs.append(doc)
                        assocs.append(att)

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
                if isinstance(instance, Post):
                    if parent_instance.proposed_in_post:
                        instance.set_parent(parent_instance.proposed_in_post)
                    assocs.append(
                        IdeaContentWidgetLink(
                            content=instance, idea=parent_instance,
                            creator=instance.creator,
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
                'ns_kv': NsDictCollection(cls),
                'ancestor_widgets': AncestorWidgetsCollectionDefinition(cls),
                'ancestor_inspiration_widgets': AncestorWidgetsCollectionDefinition(
                    cls, InspirationWidget),
                'active_showing_widget_links': ActiveShowingWidgetsCollection(cls),
                'message_columns': ColumnCollectionDefinition(cls)}

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

    def get_total_sentiments(self):
        from .action import SentimentOfPost
        from .post import Post, countable_publication_states
        from .generic import Content

        related = self.get_related_posts_query(
            partial=True, include_deleted=False)
        post_ids = Post.query.join(
            related, Post.id == related.c.post_id
        ).with_entities(Post.id).subquery()

        discussion_id = self.discussion_id
        discussion = Discussion.get(discussion_id)
        query = discussion.db.query(SentimentOfPost).filter(
            SentimentOfPost.tombstone_condition(),
            Content.tombstone_condition(),
            Post.id == Content.id,
            Post.publication_state.in_(countable_publication_states),
            *SentimentOfPost.get_discussion_conditions(discussion_id)
        )
        query = query.filter(Post.id.in_(post_ids))
        return query.count()

    crud_permissions = CrudPermissions(
        P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_ADMIN_DISC, P_ADMIN_DISC,
        P_ADMIN_DISC)


LangString.setup_ownership_load_event(Idea, ['title', 'description', 'synthesis_title'])


class RootIdea(Idea):
    """
    The root idea.  It represents the discussion.

    It has implicit links to all content and posts in the discussion.
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
        """ In the root idea, num_posts is the count of all non-deleted mesages in the discussion """
        from .post import Post
        result = self.db.query(Post).filter(
            Post.discussion_id == self.discussion_id,
            Post.hidden == False,  # noqa: E712
            Post.tombstone_condition()
        ).count()
        return int(result)

    @property
    def num_read_posts(self):
        """ In the root idea, num_posts is the count of all non-deleted read mesages in the discussion """
        from .post import Post
        from .action import ViewPost
        discussion_data = self.get_discussion_data(self.discussion_id)
        result = self.db.query(Post).filter(
            Post.discussion_id == self.discussion_id,
            Post.hidden == False,  # noqa: E712
            Post.tombstone_condition()
        ).join(
            ViewPost,
            (ViewPost.post_id == Post.id) & (ViewPost.tombstone_date == None) & (ViewPost.actor_id == discussion_data.user_id)
        ).count()
        return int(result)

    @property
    def num_contributors(self):
        """ In the root idea, num_posts is the count of contributors to
        all non-deleted mesages in the discussion """
        from .post import Post
        result = self.db.query(Post.creator_id).filter(
            Post.discussion_id == self.discussion_id,
            Post.hidden == False,  # noqa: E712
            Post.tombstone_condition()
        ).distinct().count()
        return int(result)

    @property
    def num_total_and_read_posts(self):
        return (self.num_posts, self.num_contributors, self.num_read_posts)

    @property
    def num_orphan_posts(self):
        "The number of posts unrelated to any idea in the current discussion"
        counters = self.prepare_counters(self.discussion_id)
        return counters.get_orphan_counts()[0]

    @property
    def num_synthesis_posts(self):
        """ In the root idea, this is the count of all published and non-deleted SynthesisPost of the discussion """
        return self.discussion.get_all_syntheses_query(False).count()

    def discussion_topic(self):
        return self.discussion.topic

    crud_permissions = CrudPermissions(P_ADMIN_DISC)

    @classmethod
    def graphene_type(cls):
        return 'Idea'


class IdeaLink(HistoryMixin, DiscussionBoundBase):
    """
    A generic link between two ideas

    If a parent-child relation, the parent is the source, the child the target.
    Note: it's reversed in the RDF model.
    """
    __tablename__ = 'idea_idea_link'
    rdf_type = Column(
        String(60), nullable=False, server_default='idea:InclusionRelation')
    source_id = Column(
        Integer, ForeignKey(
            'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    target_id = Column(Integer, ForeignKey(
        'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    source = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.source_id, "
                    "Idea.tombstone_date == None)",
        backref=backref(
            'target_links',
            primaryjoin="and_(Idea.id==IdeaLink.source_id, "
                        "IdeaLink.tombstone_date == None)",
            cascade="all, delete-orphan"),
        foreign_keys=(source_id))
    target = relationship(
        'Idea',
        primaryjoin="and_(Idea.id==IdeaLink.target_id, "
                    "Idea.tombstone_date == None)",
        backref=backref(
            'source_links',
            primaryjoin="and_(Idea.id==IdeaLink.target_id, "
                        "IdeaLink.tombstone_date == None)",
            cascade="all, delete-orphan"),
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
        Float, nullable=False, default=0.0)

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        if alias_maker is None:
            idea_link = alias or cls
            source_idea = Idea
        else:
            idea_link = alias or alias_maker.alias_from_class(cls)
            source_idea = alias_maker.alias_from_relns(idea_link.source)

        # Assume tombstone status of target is similar to source, for now.
        return ((idea_link.tombstone_date == None),  # noqa: E711
                (idea_link.source_id == source_idea.id),
                (source_idea.tombstone_date == None))

    def copy(self, tombstone=None, db=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            order=self.order,
            source_id=self.source_id,
            target_id=self.target_id)
        return super(IdeaLink, self).copy(db=db, **kwargs)

    def get_discussion_id(self):
        source = self.source_ts or Idea.get(self.source_id)
        return source.get_discussion_id()

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        connection = connection or self.db.connection()
        if self.is_tombstone:
            self.tombstone().send_to_changes(
                connection, CrudOperation.DELETE, discussion_id, view_def)
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
        Discussion,
        viewonly=True,
        uselist=False,
        secondary=Idea.__table__,
        primaryjoin=(source_id == Idea.id),
        # secondaryjoin=(Idea.discussion_id == Discussion.id),
        backref=backref(
            'idea_links',
            primaryjoin=(Idea.discussion_id == Discussion.id),
            secondaryjoin="""and_(IdeaLink.source_id==Idea.id,
                             Idea.tombstone_date == None,
                             IdeaLink.tombstone_date == None)""")
    )

    discussion_ts = relationship(
        Discussion,
        viewonly=True,
        uselist=False,
        secondary=Idea.__table__,
        primaryjoin=(source_id == Idea.id),
        backref='idea_links_ts'
    )


_it = Idea.__table__
_ilt = IdeaLink.__table__
Idea.num_children = column_property(
    select([func.count(_ilt.c.id)]).where(
        (_ilt.c.source_id == _it.c.id) & (_ilt.c.tombstone_date == None) & (_it.c.tombstone_date == None)  # noqa: E711
        ).correlate_except(_ilt),
    deferred=True)
