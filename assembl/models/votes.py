"""Models for voting on ideas"""
from abc import abstractproperty, abstractmethod
from datetime import datetime
import simplejson as json
import math
from collections import defaultdict
from csv import DictWriter

from sqlalchemy import (
    Column, Integer, ForeignKey, Boolean, String, Float, DateTime, Unicode,
    Text, and_, UniqueConstraint)
from sqlalchemy.sql import functions
from sqlalchemy.orm import (relationship, backref, joinedload, aliased)
from pyramid.settings import asbool

from . import (Base, DiscussionBoundBase, HistoryMixin)
from ..lib.abc import abstractclassmethod
from ..lib.sqla import DuplicateHandling
from ..lib.sqla_types import URLString
from .discussion import Discussion
from .idea import Idea, AppendingVisitor
from .auth import User
from ..auth import CrudPermissions, P_VOTE, P_SYSADMIN, P_ADMIN_DISC, P_READ
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import (VOTE, ASSEMBL, DCTERMS, QUADNAMES)
from ..views.traversal import AbstractCollectionDefinition
from .langstrings import LangString


class AbstractVoteSpecification(DiscussionBoundBase):
    """The representation of a way to vote on an idea.
    There can be more than one VoteSpecification in a Question,
    as in the case of a 2-D widget."""

    __tablename__ = "vote_specification"

    id = Column(Integer, primary_key=True)

    type = Column(String(60), nullable=False)
    __mapper_args__ = {
        'polymorphic_identity': 'abstract_vote_specification',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    widget_id = Column(Integer, ForeignKey(
        "widget.id"), nullable=False, index=True)
    "Used by a voting widget"

    criterion_idea_id = Column(Integer, ForeignKey(
        Idea.id),  # ondelete="SET NULL", onupdate="CASCADE"), WIP
        nullable=True, index=True)
    "Optional: the specification may be tied to an idea"

    question_id = Column(Integer, nullable=True)
    "Group vote specifications in questions."
    "The question is a front-end object."

    settings = Column(Text)  # JSON blob

    widget = relationship(
        "VotingWidget", backref=backref(
            "vote_specifications", cascade="all, delete-orphan"))
    criterion_idea = relationship(
        Idea, backref="criterion_for")

    retypeable_as = ("LickertVoteSpecification", "BinaryVoteSpecification",
                     "MultipleChoiceVoteSpecification", "TokenVoteSpecification")

    ##
    # TODO (MAP):
    #   These and several functions that return a hard-encoded 'local' should
    #   be migrated away from hard-encoding. The Widget APIs are supposed to be
    #   self contained, and they do not hit the SIF defintion in the process.
    def get_voting_urls(self):
        return {
            Idea.uri_generic(votable.id):
            'local:Discussion/%d/widgets/%d/vote_specifications/%d/vote_targets/%d/votes' % (
                votable.discussion_id, self.widget_id, self.id,
                votable.id)
            for votable in self.widget.votable_ideas
        }

    def get_generic_voting_url(self):
        return 'local:Discussion/%d/widgets/%d/vote_specifications/%d/votes' % (
                self.get_discussion_id(), self.widget_id, self.id)

    def get_vote_results_url(self):
        return 'local:Discussion/%d/widgets/%d/vote_specifications/%d/vote_results' % (
            self.widget.discussion_id, self.widget_id, self.id)

    # Do we want an URL to get the vote result on a specific spec+target combination?

    @abstractmethod
    def results_for(self, voting_results, histogram_size=None):
        return {
            "n": len(voting_results)
        }

    def _gather_results(self):
        vote_cls = self.get_vote_class()
        voting_results = self.db.query(vote_cls).filter_by(
            vote_spec_id=self.id,
            tombstone_date=None)
        by_idea = defaultdict(list)
        for vote in voting_results:
            by_idea[vote.idea_id].append(vote)
        return by_idea

    def voting_results(self, histogram_size=None):
        by_idea = self._gather_results()
        results = {
            Idea.uri_generic(votable_id):
            self.results_for(voting_results, histogram_size)
            for (votable_id, voting_results) in by_idea.iteritems()
        }
        results["n_voters"] = self.db.query(
            getattr(self.get_vote_class(), "voter_id")).filter_by(
            vote_spec_id=self.id,
            tombstone_date=None).distinct().count()

        return results

    @abstractmethod
    def csv_results(self, csv_file):
        pass

    def votes_of_current_user(self):
        "CAN ONLY BE CALLED FROM API V2"
        from ..auth.util import get_current_user_id
        user_id = get_current_user_id()
        if user_id is not None:
            return self.votes_of(user_id)

    def votes_of(self, user_id):
        return self.db.query(AbstractIdeaVote).filter_by(
            vote_spec_id=self.id, tombstone_date=None, voter_id=user_id).all()

    @classmethod
    def extra_collections(cls):
        from .widgets import (VotedIdeaWidgetLink)

        class VoteTargetsCollection(AbstractCollectionDefinition):
            # The set of voting target ideas.
            # Fake: There is no DB link here.
            def __init__(self, cls):
                super(VoteTargetsCollection, self).__init__(cls, Idea)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                from .widgets import (
                    VotingWidget, VotableIdeaWidgetLink)
                # TODO : Why did this work?
                # return query.filter(
                #     last_alias.discussion_id == parent_instance.discussion_id
                #     ).filter(last_alias.hidden==False)
                spec_alias = owner_alias
                widget = ctx.get_instance_of_class(VotingWidget)
                widget_alias = aliased(VotingWidget)
                votable_link_alias = aliased(VotableIdeaWidgetLink)
                idea_alias = last_alias
                return query.join(
                        votable_link_alias,
                        votable_link_alias.idea_id == idea_alias.id
                    ).join(
                        widget_alias,
                        (widget_alias.id == votable_link_alias.widget_id)
                        & (widget_alias.id == widget.id)
                    ).join(
                        spec_alias,
                        spec_alias.id == parent_instance.id
                    )

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx,
                    kwargs):
                for inst in assocs[:]:
                    widgets_coll = ctx.find_collection(
                        'VotingWidget.vote_specifications')
                    if isinstance(inst, AbstractIdeaVote):
                        inst.vote_spec = parent_instance
                        assocs.append(VotedIdeaWidgetLink(
                            widget=widgets_coll.parent_instance,
                            idea=inst.idea,
                            **self.filter_kwargs(
                                VotedIdeaWidgetLink, kwargs)))

            def contains(self, parent_instance, instance):
                return isinstance(instance, Idea)

        return {'vote_targets': VoteTargetsCollection(cls)}

    @abstractclassmethod
    def get_vote_class(cls):
        pass

    @classmethod
    def get_vote_classname(cls):
        return cls.get_vote_class().__name__

    def is_valid_vote(self, vote):
        return issubclass(vote.__class__, self.get_vote_class())

    @property
    def settings_json(self):
        if self.settings:
            return json.loads(self.settings)
        return {}

    @settings_json.setter
    def settings_json(self, val):
        self.settings = json.dumps(val)

    def get_discussion_id(self):
        widget = self.widget or Widget.get(self.widget_id)
        return widget.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .widgets import VotingWidget
        return ((cls.widget_id == VotingWidget.id),
                (VotingWidget.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ)


def empty_matrix(size, dim):
    if dim == 0:
        return 0
    if dim == 1:
        # shortcut
        return [0] * size
    return [empty_matrix(size, dim-1) for i in range(size)]


class TokenVoteSpecification(AbstractVoteSpecification):
    __tablename__ = "token_vote_specification"
    __mapper_args__ = {
        'polymorphic_identity': 'token_vote_specification'
    }

    id = Column(
        Integer, ForeignKey(AbstractVoteSpecification.id), primary_key=True)
    exclusive_categories = Column(Boolean, default=False)

    def results_for(self, voting_results, histogram_size=None):
        sums = defaultdict(int)
        nums = defaultdict(int)
        for v in voting_results:
            sums[v.token_category_id] += v.vote_value
            nums[v.token_category_id] += 1
        specs = {spec.id: spec.typename for spec in self.token_categories}
        sums = {specs[id]: total for (id, total) in sums.iteritems()}
        nums = {specs[id]: total for (id, total) in nums.iteritems()}
        return {
            "n": len(voting_results),
            "nums": nums,
            "sums": sums
        }

    def csv_results(self, csv_file, histogram_size=None):
        specs = self.token_categories
        names_from_type = {
            spec.typename: spec.name.first_original().value.encode('utf-8') for spec in specs
        }
        spec_names = names_from_type.values()
        spec_names.sort()
        spec_names.insert(0, "idea")
        dw = DictWriter(csv_file, spec_names, dialect='excel', delimiter=';')
        dw.writeheader()
        by_idea = self._gather_results()
        values = {
            votable_id: self.results_for(voting_results)
            for (votable_id, voting_results) in by_idea.iteritems()
        }
        idea_names = dict(self.db.query(Idea.id, Idea.short_title).filter(
            Idea.id.in_(by_idea.keys())))
        idea_names = {
            id: name.encode('utf-8') for (id, name) in idea_names.iteritems()}
        ordered_idea_ids = Idea.visit_idea_ids_depth_first(
            AppendingVisitor(), self.get_discussion_id())
        ordered_idea_ids = [id for id in ordered_idea_ids if id in values]
        for idea_id in ordered_idea_ids:
            base = values[idea_id]
            sums = {names_from_type[k]: v for (k, v) in base['sums'].iteritems()}
            sums['idea'] = idea_names[idea_id]
            dw.writerow(sums)

    @classmethod
    def get_vote_class(cls):
        return TokenIdeaVote

    def is_valid_vote(self, vote):
        if not issubclass(vote.__class__, self.get_vote_class()):
            return False
        if vote.token_category:
            return vote.token_category.is_valid_vote(vote)
        else:
            return True # TODO: post-validate


class TokenCategorySpecification(DiscussionBoundBase):
    "This represents a token type, with its constraints"

    __tablename__ = "token_category_specification"
    __table_args__ = (UniqueConstraint(
      'token_vote_specification_id', 'typename'),)

    id = Column(Integer, primary_key=True)
    total_number = Column(Integer, nullable=False)
    maximum_per_idea = Column(Integer)
    name_ls_id = Column(Integer, ForeignKey(LangString.id),
        nullable=False, index=True)
    typename = Column(String, nullable=False,
      doc='categories which have the same typename will be comparable (example: "positive")')
    image = Column(URLString)
    image_empty = Column(URLString)

    token_vote_specification_id = Column(
        Integer, ForeignKey(
            TokenVoteSpecification.id, ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True)
    token_vote_specification = relationship(
        TokenVoteSpecification, foreign_keys=(token_vote_specification_id,),
        backref=backref("token_categories", cascade="all, delete-orphan"))
    name = relationship(
        LangString, foreign_keys=(name_ls_id,),
        backref=backref("name_of_token_category", uselist=False),
        single_parent=True,
        lazy="joined",
        cascade="all, delete-orphan")

    color = Column(String(25))

    def get_discussion_id(self):
        tvs = self.token_vote_specification or TokenVoteSpecification.get(self.token_vote_specification_id)
        return tvs.get_discussion_id()

    def is_valid_vote(self, vote):
        if vote.vote_value < 0:
            return False
        if self.maximum_per_idea > 0 and vote.vote_value > self.maximum_per_idea:
            return False
        (total,) = self.db.query(functions.sum(TokenIdeaVote.vote_value)).filter(
            TokenIdeaVote.token_category_id == self.id,
            TokenIdeaVote.voter_id == vote.voter_id,
            TokenIdeaVote.tombstone_date == None
            ).first()
        if total > self.total_number:
            return False
        return True

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .widgets import VotingWidget
        if alias_maker is None:
            tcs = cls
            tvs = TokenVoteSpecification
            widget = VotingWidget
        else:
            tcs = alias_maker.alias_from_class(cls)
            tvs = alias_maker.alias_from_relns(tcs.token_vote_specification)
            widget = alias_maker.alias_from_relns(
                tcs.token_vote_specification, tvs.widget)
        return ((tcs.token_vote_specification_id == tvs.id),
                (tvs.widget_id == widget.id),
                (widget.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ)


LangString.setup_ownership_load_event(TokenCategorySpecification, ['name'])


class LickertVoteSpecification(AbstractVoteSpecification):
    __tablename__ = "lickert_vote_specification"
    rdf_class = VOTE.LickertRange
    __mapper_args__ = {
        'polymorphic_identity': 'lickert_vote_specification'
    }

    id = Column(
        Integer, ForeignKey(AbstractVoteSpecification.id), primary_key=True)

    minimum = Column(Integer, default=1,
                     info={'rdf': QuadMapPatternS(None, VOTE.min)})
    maximum = Column(Integer, default=10,
                     info={'rdf': QuadMapPatternS(None, VOTE.max)})

    @classmethod
    def get_vote_class(cls):
        return LickertIdeaVote

    def voting_results(self, histogram_size=None):
        if self.question_id:
            group_specs = [vs for vs in self.widget.vote_specifications
                           if vs.question_id == self.question_id
                           and isinstance(vs, LickertVoteSpecification)]
            assert self in group_specs
            if len(group_specs) > 1:
                # arbitrary but constant order
                group_specs.sort(key=lambda s: s.id)
                base_results = {
                        spec.uri(): super(LickertVoteSpecification, spec
                                    ).voting_results(histogram_size)
                        for spec in group_specs
                    }
                if histogram_size:
                    self.joint_histogram(
                        group_specs, histogram_size, base_results)
                print(base_results)
                return base_results
        return super(LickertVoteSpecification, self
                     ).voting_results(histogram_size)

    @classmethod
    def joint_histogram(
            cls, group_specs, histogram_size, joint_histograms,
            votes_by_idea_user_spec=None):
        if votes_by_idea_user_spec is None:
            votes_by_idea_user_spec = defaultdict(lambda: defaultdict(dict))
            for spec in group_specs:
                votes_by_idea = spec._gather_results()
                for idea_id, votes in votes_by_idea.iteritems():
                    for vote in votes:
                        votes_by_idea_user_spec[idea_id][
                            vote.voter_id][spec] = vote
        bin_sizes = {
            spec: float(spec.maximum - spec.minimum) / histogram_size
            for spec in group_specs
        }
        group_spec_ids = {x.id for x in group_specs}
        group_signature = ",".join([spec.uri() for spec in group_specs])
        joint_histograms[group_signature] = histograms_by_idea = {}
        sums = [0] * len(group_specs)
        sum_squares = [0] * len(group_specs)
        sum_prods = 0
        for idea_id, votes_by_user_spec in votes_by_idea_user_spec.iteritems():
            histogram = empty_matrix(histogram_size, len(group_specs))
            results = dict(histogram=histogram)
            histograms_by_idea[Idea.uri_generic(idea_id)] = results
            n = 0
            for votes_by_spec in votes_by_user_spec.itervalues():
                spec_ids = {spec.id for spec in votes_by_spec}
                if group_spec_ids <= spec_ids:  # only full
                    n += 1
                    h = histogram
                    prod = 1
                    for gn, spec in enumerate(group_specs):
                        vote_val = votes_by_spec[spec].vote_value
                        sums[gn] += vote_val
                        sum_squares[gn] += vote_val*vote_val
                        prod *= vote_val
                        bin_num = int((vote_val - spec.minimum)
                                      / bin_sizes[spec])
                        bin_num = min(bin_num, histogram_size-1)
                        bin_num = max(bin_num, 0)
                        if gn == len(group_specs) - 1:
                            h[bin_num] += 1
                        else:
                            h = h[bin_num]
                    sum_prods += prod
            results['n'] = n
            if len(group_specs) == 2 and n > 1:
                try:
                    b1 = (sums[0]*sums[1] - n*sum_prods
                          ) / (sums[0]*sums[0] - n*sum_squares[0])
                    b0 = (sums[1] - b1*sums[0])/n
                    results['b0'] = b0
                    results['b1'] = b1
                except ZeroDivisionError:
                    pass

        if len(group_specs) > 2:
            # eliminate a dimension and recurse
            for n in range(len(group_specs)):
                sub_group_specs = group_specs[:n] + group_specs[n+1:]
                cls.joint_histogram(
                    sub_group_specs, histogram_size, joint_histograms,
                    votes_by_idea_user_spec)

    def results_for(self, voting_results, histogram_size=None):
        base = super(LickertVoteSpecification, self).results_for(voting_results)
        n = len(voting_results)
        avg = sum((r.vote_value for r in voting_results)) / n
        moment2 = sum((r.vote_value**2 for r in voting_results)) / n
        var = moment2 - avg**2
        std_dev = math.sqrt(var)
        base.update(dict(avg=avg, std_dev=std_dev))
        if histogram_size:
            histogram = [0] * histogram_size
            bin_size = float(self.maximum - self.minimum) / histogram_size
            for vote in voting_results:
                bin_num = int((vote.vote_value - self.minimum) / bin_size)
                bin_num = min(bin_num, histogram_size-1)
                bin_num = max(bin_num, 0)
                histogram[bin_num] += 1
            base['histogram'] = histogram
        return base

    def csv_results(self, csv_file, histogram_size=None):
        histogram_size = histogram_size or 10
        bin_size = float(self.maximum - self.minimum) / histogram_size
        bins = range(histogram_size)
        bins.insert(0, "idea")
        bins.extend(["avg", "std_dev"])
        dw = DictWriter(csv_file, bins, dialect='excel', delimiter=';')
        dw.writeheader()
        by_idea = self._gather_results()
        values = {
            votable_id: self.results_for(voting_results, histogram_size)
            for (votable_id, voting_results) in by_idea.iteritems()
        }
        idea_names = dict(self.db.query(Idea.id, Idea.short_title).filter(
            Idea.id.in_(by_idea.keys())))
        idea_names = {
            id: name.encode('utf-8') for (id, name) in idea_names.iteritems()}
        ordered_idea_ids = Idea.visit_idea_ids_depth_first(
            AppendingVisitor(), self.get_discussion_id())
        ordered_idea_ids = [id for id in ordered_idea_ids if id in values]
        for idea_id, base in ordered_idea_ids:
            base = values[idea_id]
            r = dict(enumerate(base['histogram']))
            r['idea'] = idea_names[idea_id]
            r['avg'] = base['avg']
            r['std_dev'] = base['std_dev']
            dw.writerow(r)

    def is_valid_vote(self, vote):
        if not super(LickertVoteSpecification, self).is_valid_vote(vote):
            return False
        return self.minimum <= vote.vote_value <= self.maximum


class BinaryVoteSpecification(AbstractVoteSpecification):
    __mapper_args__ = {
        'polymorphic_identity': 'binary_vote_specification'
    }

    def results_for(self, voting_results, histogram_size=None):
        base = super(BinaryVoteSpecification, self).results_for(voting_results)
        n = len(voting_results)
        positive = len([r for r in voting_results if r.vote_value])
        base["yes"] = positive
        base["no"] = n - positive
        return base

    def csv_results(self, csv_file, histogram_size=None):
        dw = DictWriter(csv_file, ["idea", "yes", "no"],
                        dialect='excel', delimiter=';')
        dw.writeheader()
        by_idea = self._gather_results()
        values = {
            votable_id: self.results_for(voting_results)
            for (votable_id, voting_results) in by_idea.iteritems()
        }
        idea_names = dict(self.db.query(Idea.id, Idea.short_title).filter(
            Idea.id.in_(by_idea.keys())))
        idea_names = {
            id: name.encode('utf-8') for (id, name) in idea_names.iteritems()}
        ordered_idea_ids = Idea.visit_idea_ids_depth_first(
            AppendingVisitor(), self.get_discussion_id())
        ordered_idea_ids = [id for id in ordered_idea_ids if id in values]
        for idea_id, base in ordered_idea_ids:
            base = values[idea_id]
            r = {
                'idea': idea_names[idea_id],
                'yes': base['yes'],
                'no': base['no']
            }
            dw.writerow(r)

    @classmethod
    def get_vote_class(cls):
        return BinaryIdeaVote


class MultipleChoiceVoteSpecification(AbstractVoteSpecification):
    __tablename__ = "multiple_choice_vote_specification"
    __mapper_args__ = {
        'polymorphic_identity': 'multiple_choice_vote_specification'
    }

    id = Column(
        Integer, ForeignKey(AbstractVoteSpecification.id), primary_key=True)

    num_choices = Column(Integer, nullable=False)

    def results_for(self, voting_results, histogram_size=None):
        base = super(
            MultipleChoiceVoteSpecification, self).results_for(voting_results)
        by_result = defaultdict(int)
        for r in voting_results:
            by_result[r.vote_value] += 1
        base['results'] = dict(by_result)
        return base

    def csv_results(self, csv_file, histogram_size=None):
        candidates = [
            c.encode('utf-8') for c in self.settings_json['candidates']]
        cols = candidates[:]
        cols.insert(0, "idea")
        dw = DictWriter(csv_file, cols, dialect='excel', delimiter=';')
        dw.writeheader()
        by_idea = self._gather_results()
        values = {
            votable_id: self.results_for(voting_results)
            for (votable_id, voting_results) in by_idea.iteritems()
        }
        idea_names = dict(self.db.query(Idea.id, Idea.short_title).filter(
            Idea.id.in_(by_idea.keys())))
        idea_names = {
            id: name.encode('utf-8') for (id, name) in idea_names.iteritems()}
        ordered_idea_ids = Idea.visit_idea_ids_depth_first(
            AppendingVisitor(), self.get_discussion_id())
        ordered_idea_ids = [id for id in ordered_idea_ids if id in values]
        for idea_id in ordered_idea_ids:
            base = values[idea_id]
            r = {candidates[k]: n for (k, n) in base['results'].items()}
            r['idea'] = idea_names[idea_id]
            dw.writerow(r)

    @classmethod
    def get_vote_class(cls):
        return MultipleChoiceIdeaVote

    def is_valid_vote(self, vote):
        if not super(MultipleChoiceVoteSpecification, self).is_valid_vote(vote):
            return False
        return 0 <= vote.vote_value < self.num_choices


class AbstractIdeaVote(HistoryMixin, DiscussionBoundBase):
    __tablename__ = "idea_vote"

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_graph_view',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    idea_id = Column(
        Integer,
        ForeignKey(Idea.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, VOTE.subject_node)}
    )
    idea_ts = relationship(
        Idea, foreign_keys=(idea_id,),
        backref=backref("votes_ts", cascade="all, delete-orphan"))
    idea = relationship(
        Idea,
        primaryjoin="and_(Idea.id == AbstractIdeaVote.idea_id,"
                         "Idea.tombstone_date == None,"
                         "AbstractIdeaVote.tombstone_date == None)",
        foreign_keys=(idea_id,), backref="votes")

    vote_spec_id = Column(
        Integer,
        ForeignKey(AbstractVoteSpecification.id,
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    vote_spec_ts = relationship(
        AbstractVoteSpecification,
        backref=backref("votes_ts", cascade="all, delete-orphan"))
    vote_spec = relationship(
        AbstractVoteSpecification,
        primaryjoin="and_(AbstractVoteSpecification.id==AbstractIdeaVote.vote_spec_id, "
                         "AbstractIdeaVote.tombstone_date == None)",
        backref=backref("votes"))

    criterion_id = Column(
        Integer,
        ForeignKey(Idea.id),  # ondelete="SET NULL", onupdate="CASCADE"), WIP
        nullable=True, index=True
    )

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [
            QuadMapPatternS(
                cls.iri_class().apply(cls.id),
                VOTE.voting_criterion,
                Idea.iri_class().apply(cls.idea_id),
                name=QUADNAMES.voting_criterion,
                conditions=(cls.idea_id != None,)),
        ]

    # This dies and becomes indirect through vote_spec
    criterion_ts = relationship(
        Idea, foreign_keys=(criterion_id,))
    criterion = relationship(
        Idea,
        primaryjoin=and_(Idea.id == criterion_id,
                         Idea.tombstone_date == None),
        foreign_keys=(criterion_id,),
        backref="votes_using_this_criterion")

    vote_date = Column(DateTime, default=datetime.utcnow,
                       info={'rdf': QuadMapPatternS(None, DCTERMS.created)})

    voter_id = Column(
        Integer,
        ForeignKey(User.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, VOTE.voter)}
    )
    voter_ts = relationship(
        User, backref=backref("votes_ts", cascade="all, delete-orphan"))
    voter = relationship(
        User,
        primaryjoin="and_(User.id==AbstractIdeaVote.voter_id, "
                         "AbstractIdeaVote.tombstone_date == None)",
        backref="votes")

    def is_owner(self, user_id):
        return self.voter_id == user_id

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.filter(cls.voter_id == user_id)

    # Do we still need this? Can access through vote_spec
    widget_id = Column(
        Integer,
        ForeignKey("widget.id",
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    widget = relationship(
        "VotingWidget",
        primaryjoin="and_(VotingWidget.id==AbstractIdeaVote.widget_id, "
                         "AbstractIdeaVote.tombstone_date == None)",
        backref="votes")
    widget_ts = relationship(
        "VotingWidget",
        backref=backref("votes_ts", cascade="all, delete-orphan"))

    def get_discussion_id(self):
        idea = self.idea or self.idea_ts or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.idea_id == Idea.id),
                (Idea.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False,
        secondary=Idea.__table__, primaryjoin=(idea_id == Idea.id),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    @classmethod
    def external_typename(cls):
        return "IdeaVote"

    @abstractproperty
    def value(self):
        pass

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            widget=self.widget,
            discussion=self.discussion,
            voter=self.voter,
            idea=self.idea,
            criterion=self.criterion,
            vote_date=self.vote_date,
        )
        return super(AbstractIdeaVote, self).copy(**kwargs)

    def is_valid(self):
        return self.vote_spec.is_valid_vote(self)

    default_duplicate_handling = DuplicateHandling.TOMBSTONE_AND_COPY

    def unique_query(self):
        query, valid = super(AbstractIdeaVote, self).unique_query()
        idea_id = self.idea_id or (self.idea.id if self.idea else None)
        widget_id = self.widget_id or (self.widget.id if self.widget else None)
        voter_id = self.voter_id or (self.voter.id if self.voter else None)
        return (query.filter_by(
            idea_id=idea_id, widget_id=widget_id, voter_id=voter_id), True)

    crud_permissions = CrudPermissions(
        P_VOTE, P_ADMIN_DISC, P_SYSADMIN, P_SYSADMIN, P_VOTE, P_VOTE, P_READ)


class LickertIdeaVote(AbstractIdeaVote):
    __tablename__ = "lickert_idea_vote"
    __table_args__ = ()
    rdf_class = VOTE.LickertVote
    __mapper_args__ = {
        'polymorphic_identity': 'lickert_idea_vote',
    }
    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    vote_value = Column(Float, nullable=False)
    # info={'rdf': QuadMapPatternS(None, VOTE.lickert_value)}) private!

    def __init__(self, **kwargs):
        super(LickertIdeaVote, self).__init__(**kwargs)

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def value(self):
        return self.vote_value

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            vote_value=self.vote_value
        )
        return super(LickertIdeaVote, self).copy(**kwargs)

    @value.setter
    def value(self, val):
        val = float(val)
        self.vote_value = val


class MultipleChoiceIdeaVote(AbstractIdeaVote):
    __tablename__ = "multiple_choice_idea_vote"
    __table_args__ = ()
    __mapper_args__ = {
        'polymorphic_identity': 'multiple_choice_idea_vote',
    }

    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    vote_value = Column(
        Integer, nullable=False)

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value(self, val):
        val = int(val)
        if self.vote_spec:
            assert 0 <= val < self.vote_spec.num_choices
        self.vote_value = val


class BinaryIdeaVote(AbstractIdeaVote):
    rdf_class = VOTE.BinaryVote
    __tablename__ = "binary_idea_vote"
    __table_args__ = ()
    __mapper_args__ = {
        'polymorphic_identity': 'binary_idea_vote',
    }

    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    vote_value = Column(
        Boolean, nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.positive)})

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value(self, val):
        self.vote_value = asbool(val)

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            vote_value=self.vote_value
        )
        return super(BinaryIdeaVote, self).copy(**kwargs)


class TokenIdeaVote(AbstractIdeaVote):
    __tablename__ = "token_idea_vote"
    __table_args__ = ()
    __mapper_args__ = {
        'polymorphic_identity': 'token_idea_vote',
    }

    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    # the number of tokens the user sets on this idea
    vote_value = Column(
        Integer, nullable=False)

    token_category_id = Column(
        Integer, ForeignKey(TokenCategorySpecification.id,
                            ondelete='CASCADE', onupdate='CASCADE'),
        index=True)
    token_category = relationship(
        TokenCategorySpecification, foreign_keys=(token_category_id,),
        backref=backref("votes", cascade="all, delete-orphan"))

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value(self, val):
        val = int(val)
        if self.vote_spec:
            assert 0 <= val
            if self.token_category.maximum_per_idea > 0:
                assert val <= self.token_category.maximum_per_idea
        # TODO: make sure that total <= category total_number
        self.vote_value = val

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            vote_value=self.vote_value
        )
        return super(TokenIdeaVote, self).copy(**kwargs)

    def unique_query(self):
        query, _ = super(TokenIdeaVote, self).unique_query()
        token_category_id = self.token_category_id or (
            self.token_category.id if self.token_category else None)
        return (query.filter_by(token_category_id=token_category_id), True)

    @classmethod
    def external_typename(cls):
        return cls.__name__
