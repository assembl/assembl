# -*- coding: utf-8 -*-
from functools import total_ordering
from collections import defaultdict
from bisect import bisect_right

from sqlalchemy import String
from sqlalchemy.orm import (with_polymorphic, aliased)
from sqlalchemy.sql.expression import or_
from sqlalchemy.sql.functions import count

from .idea_content_link import (
    IdeaContentLink, IdeaContentPositiveLink, IdeaContentNegativeLink)
from .post import Post, Content, SynthesisPost
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
    __slots__=("positive", "post_path")

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

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        return ((self.positive == other.positive)
            and (self.post_path == other.post_path))

    def __lt__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        if self.post_path != other.post_path:
            # lexicographic sort is good enough
            return self.post_path < other.post_path
        # We want positives to come first
        return self.positive > other.positive

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
        if not len(self.paths):
            return
        self.paths.sort()
        paths = []
        last_path = self.paths[0]
        for path in self.paths[1:]:
            combined = last_path.combine(path)
            if combined:
                # print "combined:", last_path, path
                last_path = combined
            else:
                paths.append(last_path)
                last_path = path
        paths.append(last_path)
        self.paths = paths
        self.reduced = True

    def find_insertion(self, data):
        assert self.reduced
        point = bisect_right(self.paths, data)
        is_below = False
        if point:
            previous = self.paths[point-1]
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
        return self.paths[point-1].positive

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
        return " ; ".join((`x` for x in self.paths))

    def as_clause_base(self, db):
        assert self.reduced
        post = with_polymorphic(
            Post, [], Post.__table__,
            aliased=False, flat=True)

        def base_query():
            return db.query(post.id.label("post_id"))
        if not self.paths:
            return base_query().filter(False)
        direct_includes = []
        direct_excludes = []
        includes_by_level = [[]]
        excludes_by_level = [[]]
        ancestry = []
        for path in self.paths:
            while ancestry:
                if not path.post_path.startswith(ancestry[-1].post_path):
                    ancestry.pop()
            if path.positive:
                while len(includes_by_level) < len(ancestry):
                    includes_by_level.append([])
                includes_by_level[len(ancestry)].append(path.post_path)
                direct_includes.append(int(path.post_path.strip(',').split(",")[-1]))
            else:
                while len(excludes_by_level) < len(ancestry):
                    excludes_by_level.append([])
                excludes_by_level[len(ancestry)].append(path.post_path)
                direct_excludes.append(int(path.post_path.strip(',').split(",")[-1]))
        condition = (post.id.in_(direct_includes))
        max_level = max(len(includes_by_level), len(excludes_by_level))
        while len(includes_by_level) < max_level:
            includes_by_level.append([])
        while len(excludes_by_level) < max_level:
            excludes_by_level.append([])
        q = base_query()
        for level in range(max_level):
            if len(includes_by_level[level]):
                condition = or_(condition, *[
                    post.ancestry.like(path+"%")
                    for path in includes_by_level[level]])
                if level == 0:
                    condition = post.id.in_(direct_includes) | condition
            if level == 0:
                q = q.filter(condition)
            else:
                q = q.union(base_query().filter(condition))
            condition = None
            if len(excludes_by_level[level]):
                condition = or_(*[
                    post.ancestry.like(path+"%")
                    for path in excludes_by_level[level]])
            # add direct excludes at last level
            if level + 1 == max_level and direct_excludes:
                c2 = post.id.in_(direct_excludes)
                if condition is None:
                    condition = c2
                else:
                    condition = c2 | condition
            if condition is not None:
                q = q.except_(base_query().filter(condition))
        return q

    def as_clause(self, db, discussion_id, user_id=None, content=None):
        subq = self.as_clause_base(db).subquery("posts")
        content = content or with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)

        q = db.query(content).filter(
                (content.discussion_id == discussion_id)
                & (content.hidden == False)
                ).join(subq, content.id == subq.c['post_id'])
        if user_id:
            # subquery?
            q = q.outerjoin(
                ViewPost,
                (ViewPost.post_id == content.id)
                & (ViewPost.tombstone_date == None)
                & (ViewPost.actor_id == user_id)
                ).add_columns(ViewPost.id)
        return q


class PostPathGlobalCollection(object):
    "Collects PostPathLocalCollections for each idea in the discussion"
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
                ICL.idea_id != None,
                content.discussion_id==discussion.id,
                content.hidden==False)
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
    The result is that each PostPathLocalCollections's as_clause()
    is globally complete"""
    def __init__(self, discussion):
        super(PostPathCombiner, self).__init__(discussion)

    def init_from(self, post_path_global_collection):
        for id, paths in post_path_global_collection.paths.iteritems():
            self.paths[id] = paths.clone()
        self.discussion = post_path_global_collection.discussion

    def visit_idea(self, idea_id, level, prev_result):
        if isinstance(idea_id, Idea):
            idea_id = idea_id.id
        return self.paths[idea_id]

    def copy_result(self, idea_id, parent_result, child_result):
        # When the parent has no information, and can get it from a single child
        parent_result.paths = child_result.paths[:]

    def end_visit(self, idea_id, level, result, child_results):
        if isinstance(idea_id, Idea):
            idea_id = idea_id.id
        child_results = filter(None, child_results)
        if len(child_results) == 1 and not result:
            # optimisation
            self.copy_result(idea_id, result, child_results[0])
        else:
            for r in child_results:
                result.combine(r)
        self.root_idea_id = idea_id
        return result

    def orphan_clause(self, user_id=None, content=None):
        root_path = self.paths[self.root_idea_id]
        db = self.discussion.default_db
        subq = root_path.as_clause_base(db).subquery("rposts")
        content = content or with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)

        synth_post_type = SynthesisPost.__mapper_args__['polymorphic_identity']
        webpage_post_type = Webpage.__mapper_args__['polymorphic_identity']
        q = db.query(content.id.label("post_id")).filter(
                (content.discussion_id == self.discussion.id)
                & (content.hidden == False)
                & (content.type.notin_((synth_post_type, webpage_post_type)))
                & content.id.notin_(subq))
        if user_id:
            # subquery?
            q = q.outerjoin(
                ViewPost,
                (ViewPost.post_id == content.id)
                & (ViewPost.tombstone_date == None)
                & (ViewPost.actor_id == user_id)
                ).add_columns(ViewPost.id)
        return q


class PostPathCounter(PostPathCombiner):
    "Adds the ability to do post counts to PostPathCombiner."
    def __init__(self, discussion, user_id=None, calc_subset=None):
        super(PostPathCounter, self).__init__(discussion)
        self.counts = {}
        self.viewed_counts = {}
        self.read_counts = {}
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
        if self.user_id:
            # HACKITY HACK
            (content_entity, action_entity) = [
                x.entity_zero.entity for x in q._entities]
            return q.with_entities(
                count(content_entity.id), count(action_entity.id)).first()
            return (post_count, viewed_count)
        else:
            (content_entity,) = [
                x.entity_zero.entity for x in q._entities]
            (post_count,) = q.with_entities(
                count(content_entity.id)).first()
            return (post_count, None)

    def get_counts(self, idea_id):
        if self.counts.get(idea_id, None) is not None:
            return self.counts[idea_id], self.viewed_counts[idea_id]
        path_collection = self.paths[idea_id]
        if not path_collection:
            (path_collection.count, path_collection.viewed_count) = (0, None)
            self.counts[idea_id] = 0
            self.viewed_counts[idea_id] = None
            return (0, None)
        q = path_collection.as_clause(
            self.discussion.db, self.discussion.id, user_id=self.user_id)
        (post_count, viewed_count) = self.get_counts_for_query(q)
        (path_collection.count, path_collection.viewed_count) = (
            post_count, viewed_count)
        self.counts[idea_id] = post_count
        self.viewed_counts[idea_id] = viewed_count
        return (post_count, viewed_count)

    def get_orphan_counts(self):
        return self.get_counts_for_query(self.orphan_clause(self.user_id))

    def end_visit(self, idea_id, level, result, child_results):
        if isinstance(idea_id, Idea):
            idea_id = idea_id.id
        result = super(PostPathCounter, self).end_visit(
            idea_id, level, result, child_results)
        if self.calc_subset is None or (idea_id in self.calc_subset):
            self.get_counts(idea_id)
        return result


class DiscussionGlobalData(object):
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
        if self._parent_dict is None:
            source = aliased(Idea, name="source")
            target = aliased(Idea, name="target")
            self._parent_dict = dict(self.db.query(
                IdeaLink.target_id, IdeaLink.source_id
                ).join(source, source.id == IdeaLink.source_id
                ).join(target, target.id == IdeaLink.target_id
                ).filter(
                source.discussion_id == self.discussion_id,
                IdeaLink.tombstone_date == None,
                source.tombstone_date == None,
                target.tombstone_date == None,
                target.discussion_id == self.discussion_id))
        return self._parent_dict

    def idea_ancestry(self, idea_id):
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
        if (self._post_path_counter is None
                or not isinstance(self._post_path_counter, PostPathCounter)):
            collection = self.post_path_collection_raw
            counter = PostPathCounter(
                self.discussion, user_id, None if calc_all else ())
            counter.init_from(self.post_path_collection_raw)
            Idea.visit_idea_ids_depth_first(
                counter, self.discussion_id, self.children_dict)
            self._post_path_counter = counter
        return self._post_path_counter

    def reset_hierarchy(self):
        self._parent_dict = None
        self._children_dict = None
        self._post_path_counter = None

    def reset_content_links(self):
        self._post_path_collection_raw = None
        self._post_path_counter = None
