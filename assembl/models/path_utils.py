# -*- coding: utf-8 -*-
"""Utilities for traversing the set of content related to an idea and vice-versa."""

from functools import total_ordering
from collections import defaultdict
from bisect import bisect_right

from sqlalchemy import String
from sqlalchemy.orm import (with_polymorphic, aliased)
from sqlalchemy.sql.expression import or_, union, except_
from sqlalchemy.sql.functions import count

from .idea_content_link import (
    IdeaContentLink, IdeaContentPositiveLink, IdeaContentNegativeLink)
from .post import (
    Post, Content, SynthesisPost,
    countable_publication_states, deleted_publication_states)
from .annotation import Webpage
from .idea import IdeaVisitor, Idea, IdeaLink, RootIdea
from .discussion import Discussion
from .action import ViewPost

# TODO: Write a discussion structure cache manager.
# This will have caches of parent, children, counts, etc. at need
# and understand the invalidation relationships
# Tie it to request? use request.set_property?


# Cas à surveiller:
# I1 > I2 + P1 > P2
# I1 > I2 - P2
# =>
# I1, I2 < P1 / P2

# I1 > I2 + P1 > P2 > P3
# I1 > I2 - P2
# I1 > I2 > I3 + P3
# =>
# I1, I2 < P1, P3 / P2
# I3 < P3

# I1 + P1 > P2 > P3 > P4 > P5
# I1 - P2
# I1 + P3
# I1 - P5
# => I1, I2 < P1, P3, P4 / P5

# I1 > I2 + P1 > P2
# I1 > I2 - P2
# I1 > I3 + P1 > P3
# I1 > I3 - P1 > P3
# =>
# I2 < P1, P3 / P2
# I3 < P1, P2 / P3
# I1 < P1, P2, P3


@total_ordering
class PostPathData(object):
    "Data about a single post_path."
    __slots__ = ("positive", "post_path")

    def __init__(self, post_path, positive):
        self.post_path = post_path
        self.positive = positive

    def combine(self, other):
        if self.positive != other.positive:
            # if different ideas and neg subpath of pos, use pos.
            # if same idea, as below
            # Mais à faire globalement plus bas, pcq on perd des "mêmes idées" en combinant
            if self.post_path == other.post_path:
                return other if self.positive else self
            return None
        if self.post_path.startswith(other.post_path):
            return other
        elif other.post_path.startswith(self.post_path):
            return self
        return None

    @property
    def last_id(self):
        return int(self.post_path.strip(',').split(",")[-1])

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        return ((self.positive == other.positive) and (self.post_path == other.post_path))

    def __lt__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        if self.post_path != other.post_path:
            # lexicographic sort is good enough
            return self.post_path < other.post_path
        # We want positives to come first
        return self.positive > other.positive

    def __hash__(self):
        return hash(self.post_path) + int(self.positive)

    def __repr__(self):
        return "<%s%s>" % (
            self.post_path, "+" if self.positive else "-")


class PostPathLocalCollection(object):
    "Data about all PostPaths local to an Idea."

    def __init__(self):
        self.paths = []
        self.reduced = True

    def add_path(self, path):
        self.paths.append(path)
        self.reduced = False

    def combine(self, other):
        "Combine the paths from two collections (different ideas)."
        if self and other:
            # First, filter out negative paths
            # covered by positive paths in other collection
            my_paths = [p for p in other.paths if not self.is_cancelled(p)]
            other_paths = [p for p in self.paths if not other.is_cancelled(p)]
            # Then combine and reduce.
            my_paths.extend(other_paths)
            self.paths = my_paths
            self.reduce()
        else:
            # if either is empty, simple case.
            self.paths.extend(other.paths)

    def reduce(self):
        """Reduce overlapping paths.
        For example, <1,+>,<1,2,+> becomes <1,+>
        But <1,+>,<1,2,->,<1,2,3,+> remains as-is
        And <1,+>,<1,2,->,<1,3,4,+> becomes <1,+>,<1,2,->"""
        if not len(self.paths):
            return
        self.paths.sort()
        paths = []
        ancestors_by_polarity = {True: [], False: [], None: []}
        for path in self.paths:
            for ancestors in ancestors_by_polarity.itervalues():
                while ancestors:
                    if not path.post_path.startswith(ancestors[-1].post_path):
                        ancestors.pop()
                    else:
                        break
            ancestors = ancestors_by_polarity[None]
            pol_ancestors = ancestors_by_polarity[path.positive]
            # Special case: Combine in place
            if len(ancestors) and ancestors[-1].combine(path) is path:
                paths[paths.index(ancestors[-1])] = path
                ancestors[-1] = path
                pol_ancestors[-1] = path
                continue
            # Forget if it combines with a previous path of same polarity
            # BUT do not combine with distant previous path of same polarity
            # if closest previous path is super-path.
            last_path_pol = pol_ancestors[-1] if len(pol_ancestors) else None
            last_path = ancestors[-1] if len(ancestors) else None
            if last_path_pol is not None and not (
                    last_path is not last_path_pol and
                    path.post_path.startswith(last_path.post_path)):
                combined = last_path_pol.combine(path)
                assert combined is not path, "We should not combine forward"
                if combined is not None:
                    continue
            paths.append(path)
            ancestors.append(path)
            pol_ancestors.append(path)
        self.paths = paths
        self.reduced = True

    def find_insertion(self, data):
        assert self.reduced
        point = bisect_right(self.paths, data)
        is_below = False
        if point:
            previous = self.paths[point - 1]
            is_below = data.post_path.startswith(previous.post_path)
        return point, is_below

    def is_cancelled(self, subpath):
        # a negative path from another idea is cancelled if covered
        # by a positive path.
        if subpath.positive:
            return False
        point, is_below = self.find_insertion(subpath)
        if not is_below:
            return False
        return self.paths[point - 1].positive

    def includes_post(self, post_path):
        "Is this post (given as path) included in this collection?"
        # Weirdly, same logic as path cancellation.
        return self.is_cancelled(PostPathData(post_path, False))

    def __nonzero__(self):
        return bool(self.paths)

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if len(self.paths) != len(other.paths):
            return False
        for (n, path) in enumerate(self.paths):
            if path != other.paths[n]:
                return False
        return True

    def clone(self):
        clone = self.__class__()
        clone.paths = self.paths[:]
        clone.reduced = self.reduced
        return clone

    def __repr__(self):
        return " ; ".join((repr(x) for x in self.paths))

    def as_clause_base(self, db, include_breakpoints=False,
                       include_deleted=False):
        """Express collection as a SQLAlchemy query clause.

        :param bool include_breakpoints: Include posts where
            a threadbreak happens
        :param include_deleted: Include posts in deleted_publication_states.
            True means only deleted posts, None means all posts,
            False means only live posts or deleted posts with live descendants.
        """
        assert self.reduced

        def base_query(labeled=False):
            post = with_polymorphic(
                Post, [], Post.__table__,
                aliased=False, flat=True)
            content = with_polymorphic(
                Content, [], Content.__table__,
                aliased=False, flat=True)
            if labeled:
                query = db.query(post.id.label("post_id"))
            else:
                query = db.query(post.id)
            query = query.join(content, content.id == post.id)
            if include_deleted is not None:
                if include_deleted:
                    query = query.filter(
                        post.publication_state.in_(deleted_publication_states))
                else:
                    query = query.filter(content.tombstone_date == None)  # noqa: E711
            return post, query
        if not self.paths:
            post, q = base_query(True)
            return q.filter(False).subquery("relposts")
        includes_by_level = [[]]
        excludes_by_level = [[]]
        ancestry = []
        for path in self.paths:
            while ancestry:
                if not path.post_path.startswith(ancestry[-1].post_path):
                    ancestry.pop()
                else:
                    break
            level = len(ancestry) // 2
            if path.positive:
                while len(includes_by_level) <= level:
                    includes_by_level.append([])
                includes_by_level[level].append(path)
            else:
                while len(excludes_by_level) <= level:
                    excludes_by_level.append([])
                excludes_by_level[level].append(path)
            ancestry.append(path)
        max_level = max(len(includes_by_level), len(excludes_by_level))
        q = None
        for level in range(max_level):
            condition = None
            # with use_labels, name of final column determined by first query
            post, q2 = base_query(level == 0)
            includes = (includes_by_level[level]
                        if level < len(includes_by_level) else [])
            excludes = (excludes_by_level[level]
                        if level < len(excludes_by_level) else [])
            include_ids = [path.last_id for path in includes]
            exclude_ids = [path.last_id for path in excludes]
            if include_breakpoints:
                include_ids.extend(exclude_ids)
                exclude_ids = None
            if len(includes):
                ancestry_regex = '^(%s)' % ('|'.join(
                    path.post_path for path in includes))
                condition = or_(
                    post.id.in_(include_ids),
                    post.ancestry.op('~', 0, True)(ancestry_regex))
            if level == 0:
                q = q2.filter(condition)
            else:
                assert condition is not None
                q2 = q2.filter(condition)
                # works in postgres, more efficient
                q = union(q, q2, use_labels=True)
                # rather than
                # q = q.union(q2)
            condition = None
            post, q2 = base_query()
            if len(excludes):
                ancestry_regex = '^(%s)' % ('|'.join(
                    path.post_path for path in excludes))
                condition = post.ancestry.op('~', 0, True)(ancestry_regex)
                if exclude_ids:
                    condition = post.id.in_(exclude_ids) | condition
                q = except_(q, q2.filter(condition), use_labels=True)
                # q = q.except_(q2.filter(condition))
            condition = None
        if getattr(q, "c", None) is None:
            # base query
            c = q._entities[0]
            q = q.with_entities(c.expr.label("post_id"))
            q = q.subquery("relposts")
        else:
            # compound query, already has columns
            q = q.alias("relposts")
        return q

    def as_clause(self, db, discussion_id, user_id=None, content=None,
                  include_deleted=False):
        subq = self.as_clause_base(db, include_deleted=include_deleted)
        content = content or with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)

        q = db.query(content).filter(
            (content.discussion_id == discussion_id) & (content.hidden == False)  # noqa: E712
            ).join(subq, content.id == subq.c.post_id)
        if include_deleted is not None:
            if include_deleted:
                post = with_polymorphic(
                    Post, [], Post.__table__,
                    aliased=False, flat=True)
                q = q.join(
                    post, (post.id == content.id) &
                    post.publication_state.in_(deleted_publication_states))
            else:
                q = q.filter(content.tombstone_date == None)  # noqa: E711

        if user_id:
            # subquery?
            q = q.outerjoin(
                ViewPost,
                (ViewPost.post_id == content.id) & (ViewPost.tombstone_date == None) & (ViewPost.actor_id == user_id)  # noqa: E711
            ).add_columns(ViewPost.id)
        return q


class PostPathGlobalCollection(object):
    """Collects PostPathLocalCollections for each idea in the discussion
    Maintains paths, a dictionary of PostPathLocalCollections by idea_id
    """
    positives = IdeaContentPositiveLink.polymorphic_identities()
    negatives = IdeaContentNegativeLink.polymorphic_identities()

    def __init__(self, discussion=None):
        self.paths = defaultdict(PostPathLocalCollection)
        if discussion is not None:
            self.load_discussion(discussion)

    def load_discussion(self, discussion):
        self.discussion = discussion
        post = with_polymorphic(Content, [Post])
        ICL = with_polymorphic(
            IdeaContentLink, [], IdeaContentLink.__table__,
            aliased=False, flat=True)
        post = with_polymorphic(
            Post, [], Post.__table__, aliased=False, flat=True)
        # This should be a join but creates a subquery
        content = with_polymorphic(
            Content, [], Content.__table__, aliased=False, flat=True)
        q = discussion.db.query(
            ICL.idea_id,
            ICL.type,
            post.ancestry.op('||')(post.id.cast(String))
            ).join(post, post.id == ICL.content_id
            ).join(content, content.id == post.id
            ).filter(
                ICL.idea_id != None,  # noqa: E711
                content.discussion_id == discussion.id,
                content.hidden == False)
        for (idea_id, typename, path) in q:
            path += ","
            if typename in self.positives:
                self.paths[idea_id].add_path(PostPathData(path, True))
            elif typename in self.negatives:
                self.paths[idea_id].add_path(PostPathData(path, False))
        for ppc in self.paths.itervalues():
            ppc.reduce()


class PostPathCombiner(PostPathGlobalCollection, IdeaVisitor):
    """A traversal that will combine the PostPathLocalCollections
    of an idea with those of the idea's ancestors.
    The result is that the as_clause of each PostPathLocalCollections
    in self.paths is globally complete"""

    def __init__(self, discussion):
        super(PostPathCombiner, self).__init__(discussion)
        self.postponed_paths = []

    def init_from(self, post_path_global_collection):
        for id, paths in post_path_global_collection.paths.iteritems():
            self.paths[id] = paths.clone()
        self.discussion = post_path_global_collection.discussion

    def visit_idea(self, idea, level, prev_result):
        if isinstance(idea, Idea):
            idea_id = idea.id
        elif isinstance(idea, int):
            idea_id = idea
            idea = Idea.get(idea_id)
        else:
            assert False, "idea param should be an Idea object or its idea"
        return self.paths[idea_id]

    def copy_result(self, idea_id, parent_result, child_result):
        # When the parent has no information, and can get it from a single child
        parent_result.paths = child_result.paths[:]

    def end_visit(self, idea, level, result, child_results):
        if isinstance(idea, Idea):
            idea_id = idea.id
        elif isinstance(idea, int):
            idea_id = idea
            idea = Idea.get(idea_id)
        else:
            assert False, "idea param should be an Idea object or its idea"
        child_results = [
            (child, res) for (child, res) in child_results if bool(res)]
        if (len(child_results) == 1 and not result and
                child_results[0][0].propagate_message_count()):
            # optimisation
            self.copy_result(idea_id, result, child_results[0][1])
        else:
            for (child, res) in child_results:
                if child.propagate_message_count():
                    result.combine(res)
                else:
                    self.postponed_paths.append(res)
        if isinstance(idea, RootIdea):
            self.root_idea_id = idea_id
            for path in self.postponed_paths:
                result.combine(path)
        return result

    def orphan_clause(self, user_id=None, content=None, include_deleted=False):
        root_path = self.paths[self.root_idea_id]
        db = self.discussion.default_db
        subq = root_path.as_clause_base(db, include_deleted=include_deleted)
        content = content or with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)

        synth_post_type = SynthesisPost.__mapper_args__['polymorphic_identity']
        webpage_post_type = Webpage.__mapper_args__['polymorphic_identity']
        q = db.query(content.id.label("post_id")).filter(
            (content.discussion_id == self.discussion.id) &
            (content.hidden == False) &  # noqa: E712
            (content.type.notin_((synth_post_type, webpage_post_type))) &
            content.id.notin_(subq))
        if include_deleted is not None:
            if include_deleted:
                post = with_polymorphic(
                    Post, [], Post.__table__,
                    aliased=False, flat=True)
                q = q.join(
                    post, (post.id == content.id) &
                    post.publication_state.in_(deleted_publication_states))
            else:
                q = q.filter(content.tombstone_date == None)  # noqa: E711

        if user_id:
            # subquery?
            q = q.outerjoin(
                ViewPost,
                (ViewPost.post_id == content.id) & (ViewPost.tombstone_date == None) & (ViewPost.actor_id == user_id)  # noqa: E711
            ).add_columns(ViewPost.id)
        return q


class PostPathCounter(PostPathCombiner):
    "Adds the ability to do post counts to PostPathCombiner."

    def __init__(self, discussion, user_id=None, calc_subset=None):
        super(PostPathCounter, self).__init__(discussion)
        self.counts = {}
        self.viewed_counts = {}
        self.read_counts = {}
        self.contributor_counts = {}
        self.user_id = user_id
        self.calc_subset = calc_subset

    def copy_result(self, idea_id, parent_result, child_result):
        # When the parent has no information, and can get it from a single child
        super(PostPathCounter, self).copy_result(
            idea_id, parent_result, child_result)
        if getattr(parent_result, "count", None) is None:
            return
        parent_result.count = child_result.count
        parent_result.viewed_count = child_result.viewed_count
        self.counts[idea_id] = parent_result.count
        self.viewed_counts[idea_id] = parent_result.viewed_count

    def get_counts_for_query(self, q):
        # HACKITY HACK
        entities = [
            x.entity_zero.entity for x in q._entities]
        entities = {e.__mapper__.tables[0].name: e for e in entities}
        content_entity = entities['content']

        post = with_polymorphic(
            Post, [], Post.__table__,
            aliased=False, flat=True)
        q = q.join(
            post, (content_entity.id == post.id) &
                  (post.publication_state.in_(countable_publication_states)))

        if self.user_id:
            action_entity = entities['action']
            return q.with_entities(
                count(content_entity.id),
                count(post.creator_id.distinct()),
                count(action_entity.id)).first()
        else:
            (post_count, contributor_count) = q.with_entities(
                count(content_entity.id),
                count(post.creator_id.distinct())).first()
            return (post_count, contributor_count, 0)

    def get_counts(self, idea_id):
        if self.counts.get(idea_id, None) is not None:
            return (
                self.counts[idea_id],
                self.contributor_counts[idea_id],
                self.viewed_counts[idea_id])
        path_collection = self.paths[idea_id]
        if not path_collection:
            (
                path_collection.count,
                path_collection.contributor_count,
                path_collection.viewed_count
            ) = (0, 0, 0)
            self.counts[idea_id] = 0
            self.contributor_counts[idea_id] = 0
            self.viewed_counts[idea_id] = 0
            return (0, 0, 0)
        q = path_collection.as_clause(
            self.discussion.db, self.discussion.id, user_id=self.user_id,
            include_deleted=None)
        (
            post_count, contributor_count, viewed_count
        ) = self.get_counts_for_query(q)
        (
            path_collection.count,
            path_collection.contributor_count,
            path_collection.viewed_count
        ) = (
            post_count, contributor_count, viewed_count
        )
        self.counts[idea_id] = post_count
        self.viewed_counts[idea_id] = viewed_count
        self.contributor_counts[idea_id] = contributor_count
        return (post_count, contributor_count, viewed_count)

    def get_orphan_counts(self, include_deleted=False):
        return self.get_counts_for_query(
            self.orphan_clause(self.user_id, include_deleted=include_deleted))

    def end_visit(self, idea, level, result, child_results):
        if isinstance(idea, Idea):
            idea_id = idea.id
        elif isinstance(idea, int):
            idea_id = idea
            idea = Idea.get(idea_id)
        else:
            assert False, "idea param should be an Idea object or its idea"
        result = super(PostPathCounter, self).end_visit(
            idea, level, result, child_results)
        if self.calc_subset is None or (idea_id in self.calc_subset):
            self.get_counts(idea_id)
        return result


class DiscussionGlobalData(object):
    "Cache for global discussion data, lasts as long as the pyramid request object."

    def __init__(self, db, discussion_id, user_id=None, discussion=None):
        self.discussion_id = discussion_id
        self.db = db
        self.user_id = user_id
        self._discussion = discussion
        self._parent_dict = None
        self._children_dict = None
        self._post_path_collection_raw = None
        self._post_path_counter = None

    @property
    def discussion(self):
        if self._discussion is None:
            self._discussion = Discussion.get(self.discussion_id)
        return self._discussion

    @property
    def parent_dict(self):
        """dictionary child_idea.id -> parent_idea.id.

        TODO: Make it dict(id->id[]) for multiparenting"""
        if self._parent_dict is None:
            source = aliased(Idea, name="source")
            target = aliased(Idea, name="target")
            self._parent_dict = dict(self.db.query(
                IdeaLink.target_id, IdeaLink.source_id
                ).join(source, source.id == IdeaLink.source_id
                ).join(target, target.id == IdeaLink.target_id
                ).filter(
                source.discussion_id == self.discussion_id,
                IdeaLink.tombstone_date == None,  # noqa: E711
                source.tombstone_date == None,
                target.tombstone_date == None,
                target.discussion_id == self.discussion_id))
        return self._parent_dict

    def idea_ancestry(self, idea_id):
        """generator of ids of ancestor ideas"""
        while idea_id:
            yield idea_id
            idea_id = self.parent_dict.get(idea_id, None)

    @property
    def children_dict(self):
        if self._children_dict is None:
            if not self.parent_dict:
                (root_id,) = self.db.query(
                    RootIdea.id).filter_by(
                    discussion_id=self.discussion_id).first()
                self._children_dict = {None: (root_id,), root_id: ()}
                return self._children_dict
            children = defaultdict(list)
            for child, parent in self.parent_dict.iteritems():
                children[parent].append(child)
            root = set(children.keys()) - set(self.parent_dict.keys())
            assert len(root) == 1
            children[None] = [root.pop()]
            self._children_dict = children
        return self._children_dict

    @property
    def post_path_collection_raw(self):
        if self._post_path_collection_raw is None:
            self._post_path_collection_raw = PostPathGlobalCollection(self.discussion)
        return self._post_path_collection_raw

    def post_path_counter(self, user_id, calc_all):
        if (self._post_path_counter is None or not isinstance(self._post_path_counter, PostPathCounter)):
            counter = PostPathCounter(
                self.discussion, user_id, None if calc_all else ())
            counter.init_from(self.post_path_collection_raw)
            self.discussion.root_idea.visit_ideas_depth_first(counter)
            self._post_path_counter = counter
        return self._post_path_counter

    def reset_hierarchy(self):
        self._parent_dict = None
        self._children_dict = None
        self._post_path_counter = None

    def reset_content_links(self):
        self._post_path_collection_raw = None
        self._post_path_counter = None
