from itertools import chain
from datetime import datetime

from sqlalchemy import (
    Column, Integer, ForeignKey, Text, String, DateTime, inspect)
from sqlalchemy.sql import text, column
from sqlalchemy.orm import (relationship, backref, aliased, join)
from sqlalchemy.ext.associationproxy import association_proxy
import simplejson as json
import uuid

from ..auth import (
    CrudPermissions, P_ADD_IDEA, P_READ, P_EDIT_IDEA)
from . import DiscussionBoundBase
from .discussion import Discussion
from .idea import (Idea, IdeaLink)
from .idea_content_link import IdeaContentWidgetLink
from .generic import Content
from .post import Post, IdeaProposalPost
from ..auth import P_ADD_POST, P_ADMIN_DISC, Everyone, CrudPermissions
from .auth import User
from ..views.traversal import (
    CollectionDefinition, AbstractCollectionDefinition)
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import (ASSEMBL, QUADNAMES)

ISO_8601_FORMAT = '%Y-%m-%dT%H:%M:%S'


class Widget(DiscussionBoundBase):
    __tablename__ = "widget"

    id = Column(Integer, primary_key=True)

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'widget',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    settings = Column(Text)  # JSON blob
    state = Column(Text)  # JSON blob

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    discussion = relationship(
        Discussion, backref=backref("widgets", cascade="all, delete-orphan"),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    def __init__(self, *args, **kwargs):
        super(Widget, self).__init__(*args, **kwargs)
        self.interpret_settings(self.settings_json)

    def idea_data(self, user_id):
        return []

    def interpret_settings(self, settings):
        pass

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    @classmethod
    def get_ui_endpoint_base(cls):
        # TODO: Make this configurable.
        return None

    def get_ui_endpoint(self):
        uri = self.get_ui_endpoint_base()
        assert uri
        return "%s?config=%s" % (uri, self.uri())

    def get_user_state_url(self):
        return 'local:Widget/%d/user_state' % (self.id,)

    def get_settings_url(self):
        return 'local:Widget/%d/settings' % (self.id,)

    def get_state_url(self):
        return 'local:Widget/%d/state' % (self.id,)

    def get_user_states_url(self):
        return 'local:Widget/%d/user_states' % (self.id,)

    # Eventually: Use extra_columns to get WidgetUserConfig
    # through user_id instead of widget_user_config.id

    @property
    def settings_json(self):
        if self.settings:
            return json.loads(self.settings)
        return {}

    @settings_json.setter
    def settings_json(self, val):
        self.settings = json.dumps(val)
        self.interpret_settings(val)

    @property
    def state_json(self):
        if self.state:
            return json.loads(self.state)
        return {}

    @state_json.setter
    def state_json(self, val):
        self.state = json.dumps(val)

    def get_user_state(self, user_id):
        state = self.db.query(WidgetUserConfig).filter_by(
            widget=self, user_id=user_id).first()
        if state:
            return state.state_json

    def get_all_user_states(self):
        return [c.state_json for c in self.user_configs]

    def set_user_state(self, user_state, user_id):
        state = self.db.query(WidgetUserConfig).filter_by(
            widget=self, user_id=user_id).first()
        if not state:
            state = WidgetUserConfig(widget=self, user_id=user_id)
            self.db.add(state)
        state.state_json = user_state

    def update_from_json(self, json, user_id=Everyone, ctx=None):
        from ..auth.util import user_has_permission
        if user_has_permission(self.discussion_id, user_id, P_ADMIN_DISC):
            new_type = json.get('@type', self.type)
            if self.type != new_type:
                polymap = inspect(self.__class__).polymorphic_identity
                if new_type not in polymap:
                    return None
                new_type = polymap[new_type].class_
                new_instance = self.change_class(new_type)
                return new_instance.update_from_json(json, user_id, ctx)
            if 'settings' in json:
                self.settings_json = json['settings']
            if 'discussion' in json:
                self.discussion = Discussion.get_instance(json['discussion'])
        if 'state' in json:
            self.state_json = json['state']
        if user_id and user_id != Everyone and 'user_state' in json:
            self.set_user_state(json['user_state'], user_id)
        return self

    crud_permissions = CrudPermissions(P_ADMIN_DISC)

    def notification_data(self, notification_setting_data):
        pass

    def has_notification(self):
        settings = self.settings_json
        notifications = settings.get('notifications', [])
        now = datetime.utcnow()

        for notification in notifications:
            try:
                start = datetime.strptime(
                    notification['start'], ISO_8601_FORMAT)
                end = notification.get('end', None)
                end = datetime.strptime(end, ISO_8601_FORMAT) if end else datetime.max
                if now < start or now > end:
                    continue
            except (ValueError, TypeError, KeyError) as e:
                continue
            notification_data = self.notification_data(notification)
            if notification_data:
                yield notification_data


class BaseIdeaWidget(Widget):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_view_widget',
    }

    def interpret_settings(self, settings):
        if 'idea' in settings:
            self.set_base_idea_id(Idea.get_database_id(settings['idea']))

    def base_idea_id(self):
        if self.base_idea_link:
            return self.base_idea_link.idea_id

    def idea_data(self, user_id):
        return [{
            'idea': Idea.uri_generic(self.base_idea_id()),
            '@type': 'base_idea_widget_link'
        }]

    def set_base_idea_id(self, id):
        idea = Idea.get_instance(id)
        if self.base_idea_link:
            self.base_idea_link.idea_id = id
        else:
            self.base_idea_link = BaseIdeaWidgetLink(widget=self, idea=idea)
            self.db.add(self.base_idea_link)
        # This is wrong, but not doing it fails.
        self.base_idea = idea

    def get_ideas_url(self):
        return 'local:Discussion/%d/widgets/%d/base_idea/-/children' % (
            self.discussion_id, self.id)

    def get_messages_url(self):
        return 'local:Discussion/%d/widgets/%d/base_idea/-/widgetposts' % (
            self.discussion_id, self.id)

    @classmethod
    def extra_collections(cls):
        return {'base_idea': BaseIdeaCollection(),
                'base_idea_descendants': BaseIdeaDescendantsCollection() }


class BaseIdeaCollection(CollectionDefinition):
    def __init__(self):
        super(BaseIdeaCollection, self).__init__(
            BaseIdeaWidget, BaseIdeaWidget.base_idea)

    def decorate_query(self, query, last_alias, parent_instance, ctx):
        widget = self.owner_alias
        idea = last_alias
        return query.join(
            BaseIdeaWidgetLink,
            idea.id == BaseIdeaWidgetLink.idea_id).join(
                widget).filter(widget.id == parent_instance.id).filter(
                    widget.idea_links.of_type(BaseIdeaWidgetLink))

class BaseIdeaDescendantsCollection(AbstractCollectionDefinition):
    descendants = text("""SELECT id from (SELECT target_id as id FROM (
                SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                    target_id, source_id FROM idea_idea_link WHERE is_tombstone=0
                ) il
            WHERE il.source_id = :base_idea_id
            UNION SELECT :base_idea_id as id) recid"""
    ).columns(column('id'))

    def __init__(self):
        super(BaseIdeaDescendantsCollection, self).__init__(
            BaseIdeaWidget, Idea)

    def decorate_query(self, query, last_alias, parent_instance, ctx):
        widget = self.owner_alias
        descendant = last_alias
        base_idea = aliased(Idea, name="base_idea")
        # using base_idea_id() is cheating, but a proper join fails.
        descendants_subq = self.descendants.bindparams(
            base_idea_id=parent_instance.base_idea_id()).alias()
        query = query.filter(
            descendant.id.in_(descendants_subq)).join(
            widget, widget.id == parent_instance.id)
        return query

    def contains(self, parent_instance, instance):
        widget = self.owner_alias
        descendant = aliased(Idea, name="descendant")
        base_idea = aliased(Idea, name="base_idea")
        # using base_idea_id() is cheating, but a proper join fails.
        descendants_subq = self.descendants.bindparams(
            base_idea_id=parent_instance.base_idea_id()).alias()
        query = instance.db.query(descendant).filter(
            descendant.id.in_(descendants_subq)).join(
            widget, widget.id == parent_instance.id)
        return query.count() > 0

    def decorate_instance(
            self, instance, parent_instance, assocs, user_id,
            ctx, kwargs):
        pass


class IdeaCreatingWidget(BaseIdeaWidget):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_creating_widget',
    }

    def get_confirm_ideas_url(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return ('local:Discussion/%d/widgets/%d/confirm_ideas') % (
                self.discussion_id, self.id)

    def get_confirm_messages_url(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return ('local:Discussion/%d/widgets/%d/confirm_messages') % (
                self.discussion_id, self.id)

    def get_confirmed_ideas(self):
        # TODO : optimize
        return [idea.uri() for idea in self.generated_ideas if not idea.hidden]

    def idea_data(self, user_id):
        for id in super(IdeaCreatingWidget, self).idea_data(user_id):
            yield id
        for link in self.generated_idea_links:
            yield {
                'idea': Idea.uri_generic(link.idea_id),
                '@type': 'created_idea',
                'state': {
                    'hidden': link.idea.hidden
                }
            }

    def set_confirmed_ideas(self, idea_ids):
        for idea in self.generated_ideas:
            uri = idea.uri()
            idea.hidden = (uri not in idea_ids)

    def get_confirmed_messages(self):
        root_idea_id = self.base_idea_id()
        ids = self.db.query(Content.id).join(
            IdeaContentWidgetLink).join(Idea).join(
                IdeaLink, IdeaLink.target_id == Idea.id).filter(
                    IdeaLink.source_id == root_idea_id
                ).filter(~Content.hidden).all()
        return [Content.uri_generic(id) for (id,) in ids]

    def set_confirmed_messages(self, post_ids):
        root_idea_id = self.base_idea_id()
        for post in self.db.query(Content).join(IdeaContentWidgetLink).join(
                Idea).join(IdeaLink, IdeaLink.target_id == Idea.id).filter(
                IdeaLink.source_id == root_idea_id).all():
            post.hidden = (post.uri() not in post_ids)

    def get_ideas_hiding_url(self):
        return 'local:Discussion/%d/widgets/%d/base_idea_hiding/-/children' % (
            self.discussion_id, self.id)

    @classmethod
    def extra_collections(cls):
        class BaseIdeaCollectionC(BaseIdeaCollection):
            hide_proposed_ideas = False

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                query = super(BaseIdeaCollectionC, self).decorate_query(
                    query, last_alias, parent_instance, ctx)
                children_ctx = ctx.find_collection(
                    'ChildIdeaCollectionDefinition')
                if children_ctx:
                    gen_idea_link = aliased(GeneratedIdeaWidgetLink)
                    query = query.join(
                        gen_idea_link,
                        (gen_idea_link.idea_id ==
                            children_ctx.collection_class_alias.id))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                super(BaseIdeaCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        inst.hidden = True
                        post = IdeaProposalPost(
                            proposes_idea=inst, creator_id=user_id,
                            discussion_id=inst.discussion_id,
                            message_id=uuid.uuid1().urn,
                            hidden=self.hide_proposed_ideas,
                            body="", subject=inst.short_title,
                            **self.filter_kwargs(
                                IdeaProposalPost, kwargs))
                        assocs.append(post)
                        assocs.append(IdeaContentWidgetLink(
                            content=post, idea=inst.parents[0],
                            creator_id=user_id,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))
                        assocs.append(GeneratedIdeaWidgetLink(
                            idea=inst,
                            **self.filter_kwargs(
                                GeneratedIdeaWidgetLink, kwargs)))

        class BaseIdeaHidingCollection(BaseIdeaCollectionC):
            hide_proposed_ideas = True

        class BaseIdeaDescendantsCollectionC(BaseIdeaDescendantsCollection):
            hide_proposed_ideas = False

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                query = super(BaseIdeaDescendantsCollectionC, self).decorate_query(
                    query, last_alias, parent_instance, ctx)
                children_ctx = ctx.find_collection(
                    'ChildIdeaCollectionDefinition')
                if children_ctx:
                    gen_idea_link = aliased(GeneratedIdeaWidgetLink)
                    query = query.join(
                        gen_idea_link,
                        (gen_idea_link.idea_id ==
                            children_ctx.collection_class_alias.id))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx, kwargs):
                super(BaseIdeaDescendantsCollectionC, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        inst.hidden = True
                        post = IdeaProposalPost(
                            proposes_idea=inst, creator_id=user_id,
                            discussion_id=inst.discussion_id,
                            message_id=uuid.uuid1().urn,
                            hidden=self.hide_proposed_ideas,
                            body="", subject=inst.short_title,
                            **self.filter_kwargs(
                                IdeaProposalPost, kwargs))
                        assocs.append(post)
                        assocs.append(IdeaContentWidgetLink(
                            content=post, idea=inst.parents[0],
                            creator_id=user_id,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))
                        assocs.append(GeneratedIdeaWidgetLink(
                            idea=inst,
                            **self.filter_kwargs(
                                GeneratedIdeaWidgetLink, kwargs)))

        return dict(BaseIdeaWidget.extra_collections(),
            base_idea=BaseIdeaCollectionC(),
            base_idea_hiding=BaseIdeaHidingCollection(),
            base_idea_descendants=BaseIdeaDescendantsCollectionC())

    # @property
    # def generated_ideas(self):
    #     return [l.idea for l in self.generated_idea_links]


class InspirationWidget(IdeaCreatingWidget):
    default_view = 'creativity_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'inspiration_widget',
    }

    @classmethod
    def get_ui_endpoint_base(cls):
        # TODO: Make this configurable.
        return "/static/widget/creativity/"

    def get_add_post_endpoint(self, idea):
        return 'local:Discussion/%d/widgets/%d/base_idea_descendants/%d/linkedposts' % (
            self.discussion_id, self.id, idea.id)


class CreativitySessionWidget(IdeaCreatingWidget):
    default_view = 'creativity_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'creativity_session_widget',
    }

    @classmethod
    def get_ui_endpoint_base(cls):
        # TODO: Make this configurable.
        return "/static/widget/session/"

    def notification_data(self, data):
        end = data.get('end', None)
        time_to_end = (datetime.strptime(end, ISO_8601_FORMAT) - datetime.utcnow()
                       ).total_seconds() if end else None
        participant_ids = set()
        # participants from user_configs
        participant_ids.update((c.user_id for c in self.user_configs))
        # Participants from comments
        participant_ids.update((c[0] for c in self.db.query(
            Post.creator_id).join(IdeaContentWidgetLink).filter(
                Widget.id == self.id)))
        # Participants from created ideas
        participant_ids.update((c[0] for c in self.db.query(
            IdeaProposalPost.creator_id).join(
                Idea, GeneratedIdeaWidgetLink).filter(
                    Widget.id == self.id)))
        return dict(
            data,
            widget_url=self.uri(),
            time_to_end=time_to_end,
            num_participants=len(participant_ids),
            num_ideas=len(self.generated_idea_links))

    def get_add_post_endpoint(self, idea):
        return 'local:Discussion/%d/widgets/%d/base_idea/-/children/%d/widgetposts' % (
            self.discussion_id, self.id, idea.id)


class MultiCriterionVotingWidget(Widget):
    default_view = 'voting_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'multicriterion_voting_widget',
    }

    @classmethod
    def get_ui_endpoint_base(cls):
        # TODO: Make this configurable.
        return "/static/widget/vote/"

    def idea_data(self, user_id):
        for link in self.criteria_links:
            yield {
                'idea': Idea.uri_generic(link.idea_id),
                '@type': 'criterion',
            }
        my_votes = []
        vote_idea_ids = set()
        if user_id:
            from .votes import AbstractIdeaVote
            my_votes = self.db.query(AbstractIdeaVote
                ).join(AbstractIdeaVote.voter, AbstractIdeaVote.idea,
                       VotedIdeaWidgetLink, Widget
                ).filter(Widget.id == self.id, User.id==user_id).all()
            vote_idea_ids = {vote.idea_id: vote for vote in my_votes}
        for link in self.votable_idea_links:
            if link.idea_id in vote_idea_ids:
                yield {
                    'idea': Idea.uri_generic(link.idea_id),
                    '@type': 'voted',
                    'state': vote_idea_ids[link.idea_id].generic_json(
                        user_id=user_id)
                }
            else:
                yield {
                    'idea': Idea.uri_generic(link.idea_id),
                    '@type': 'votable',
                }

    def interpret_settings(self, settings):
        super(MultiCriterionVotingWidget, self).interpret_settings(settings)
        if 'criteria' in settings:
            for criterion in settings['criteria']:
                try:
                    criterion_idea = Idea.get_instance(criterion["@id"])
                    self.add_criterion(criterion_idea)
                except Exception as e:
                    print "Missing criterion. Discarded.", criterion
        if 'votables' in settings:
            for votable_id in settings['votables']:
                try:
                    votable_idea = Idea.get_instance(votable_id)
                    self.add_votable(votable_idea)
                except Exception as e:
                    print "Missing votable. Discarded.", votable_id
        elif 'votable_root_id' in settings:
            try:
                votable_root_idea = Idea.get_instance(
                    settings['votable_root_id'])
            except Exception as e:
                print "Cannot find votable root.", settings['votable_root_id']
                return
            if len(votable_root_idea.children):
                for child in votable_root_idea.children:
                    self.add_votable(child)
            else:
                self.add_votable(votable_root_idea)

    @property
    def criteria_url(self):
        return 'local:Discussion/%d/widgets/%d/criteria' % (
            self.discussion_id, self.id)

    @property
    def votables_url(self):
        return 'local:Discussion/%d/widgets/%d/targets/' % (
            self.discussion_id, self.id)

    def get_user_votes_url(self, idea_id):
        return 'local:Discussion/%d/widgets/%d/targets/%d/votes' % (
            self.discussion_id, self.id, Idea.get_database_id(idea_id))

    def get_vote_results_url(self, idea_id):
        return 'local:Discussion/%d/widgets/%d/targets/%d/vote_results' % (
            self.discussion_id, self.id, Idea.get_database_id(idea_id))

    def get_vote_counts_url(self, idea_id):
        return 'local:Discussion/%d/widgets/%d/targets/%d/vote_counts' % (
            self.discussion_id, self.id, Idea.get_database_id(idea_id))

    def get_voting_urls(self, idea_id):
        return {
            Idea.uri_generic(criterion_link.idea_id):
            'local:Discussion/%d/widgets/%d/criteria/%d/vote_targets/%d/votes' % (
                self.discussion_id, self.id, criterion_link.idea_id,
                Idea.get_database_id(idea_id))
            for criterion_link in self.criteria_links
        }

    def add_criterion(self, idea):
        if idea not in self.criteria:
            self.criteria_links.append(VotingCriterionWidgetLink(
                widget=self, idea=idea))

    def remove_criterion(self, idea):
        for link in self.criteria_links:
            if link.idea == idea:
                self.criteria_links.remove(link)
                return

    def set_criteria(self, ideas):
        idea_ids = {idea.id for idea in ideas}
        for link in list(self.criteria_links):
            if link.idea_id not in idea_ids:
                self.criteria_links.remove(link)
                self.db.delete(link)
            else:
                idea_ids.remove(link.idea_id)
        for idea in ideas:
            if idea.id in idea_ids:
                self.criteria_links.append(VotingCriterionWidgetLink(
                    widget=self, idea=idea))

    def add_votable(self, idea):
        if idea not in self.votable_ideas:
            self.votable_idea_links.append(VotableIdeaWidgetLink(
                widget=self, idea=idea))

    def remove_votable(self, idea):
        for link in self.votable_idea_links:
            if link.idea == idea:
                self.votable_idea_links.remove(link)
                return

    def set_votables(self, ideas):
        idea_ids = {idea.id for idea in ideas}
        for link in list(self.votable_idea_links):
            if link.idea_id not in idea_ids:
                self.votable_idea_links.remove(link)
                self.db.delete(link)
            else:
                idea_ids.remove(link.idea_id)
        for idea in ideas:
            if idea.id in idea_ids:
                self.votable_idea_links.append(VotableIdeaWidgetLink(
                    widget=self, idea=idea))

    @classmethod
    def extra_collections(cls):
        from .votes import AbstractIdeaVote
        class CriterionCollection(CollectionDefinition):
            # The set of voting criterion ideas.
            # Not to be confused with http://www.criterion.com/
            def __init__(self, cls):
                super(CriterionCollection, self).__init__(
                    cls, cls.criteria)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                widget = self.owner_alias
                idea = last_alias
                return query.join(idea.has_criterion_links).join(
                    widget).filter(widget.id == parent_instance.id)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx,
                    kwargs):
                super(CriterionCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        assocs.append(VotingCriterionWidgetLink(
                            idea=inst,
                            **self.filter_kwargs(
                                VotingCriterionWidgetLink, kwargs)))
                    elif isinstance(inst, AbstractIdeaVote):
                        criterion_ctx = ctx.find_collection(
                            'CriterionCollection.criteria')
                        search_ctx = ctx
                        while (search_ctx.__parent__
                               and search_ctx.__parent__ != criterion_ctx):
                            search_ctx = search_ctx.__parent__
                        assert search_ctx.__parent__
                        inst.criterion = search_ctx._instance

        class VotableCollection(CollectionDefinition):
            # The set of votable ideas.
            def __init__(self, cls):
                super(VotableCollection, self).__init__(
                    cls, cls.votable_ideas)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                widget = self.owner_alias
                idea = last_alias
                query = query.join(idea.has_votable_links).join(
                    widget).filter(widget.id == parent_instance.id)
                # This is unhealthy knowledge, but best I can do now.
                vote_coll = ctx.find_collection('CollectionDefinition.votes')
                if vote_coll:
                    query = query.filter(
                        vote_coll.collection_class_alias.widget_id ==
                        parent_instance.id)
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx,
                    kwargs):
                super(VotableCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        assocs.append(VotableIdeaWidgetLink(
                            idea=inst,
                            widget=self.parent_instance,
                            **self.filter_kwargs(
                                VotableIdeaWidgetLink, kwargs)))

        return {'criteria': CriterionCollection(cls),
                'targets': VotableCollection(cls)}

    # @property
    # def criteria(self):
    #     return [cl.idea for cl in self.criteria_links]


class WidgetUserConfig(DiscussionBoundBase):
    __tablename__ = "widget_user_config"

    id = Column(Integer, primary_key=True)

    widget_id = Column(
        Integer,
        ForeignKey('widget.id',
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    widget = relationship(Widget, backref=backref(
        "user_configs", cascade="all, delete-orphan"))

    user_id = Column(
        Integer,
        ForeignKey('user.id',
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    user = relationship(User)

    state = Column('settings', Text)  # JSON blob

    @property
    def state_json(self):
        if self.state:
            return json.loads(self.state)
        return {}

    @state_json.setter
    def state_json(self, val):
        self.state = json.dumps(val)

    def get_discussion_id(self):
        return self.widget.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.widget_id == Widget.id),
                (Widget.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Widget.__table__,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    crud_permissions = CrudPermissions(P_ADD_POST)  # all participants...


class IdeaWidgetLink(DiscussionBoundBase):
    __tablename__ = 'idea_widget_link'

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    type = Column(String(60))

    idea_id = Column(Integer, ForeignKey(Idea.id),
                     nullable=False, index=True)
    idea = relationship(Idea, backref=backref(
        "widget_links", cascade="all, delete-orphan"))

    widget_id = Column(Integer, ForeignKey(
        Widget.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    #widget = relationship(Widget, backref='idea_links')

    context_url = Column(String())

    __mapper_args__ = {
        'polymorphic_identity': 'abstract_idea_widget_link',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        if self.idea:
            return self.idea.get_discussion_id()
        elif self.idea_id:
            return Idea.get(self.idea_id).get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.idea_id == Idea.id),
                (Idea.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Idea.__table__,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    crud_permissions = CrudPermissions(
        P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA,
        P_EDIT_IDEA, P_EDIT_IDEA)

Idea.widgets = association_proxy('widget_links', 'widget')
Widget.idea_links = relationship(
    IdeaWidgetLink,
    backref=backref('widget', uselist=False),
    cascade="all, delete-orphan")


class BaseIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'base_idea_widget_link',
    }

BaseIdeaWidget.base_idea_link = relationship(
    BaseIdeaWidgetLink, uselist=False)

BaseIdeaWidget.base_idea = relationship(
    Idea, viewonly=True, secondary=BaseIdeaWidgetLink.__table__,
    primaryjoin=BaseIdeaWidget.idea_links.of_type(BaseIdeaWidgetLink),
    secondaryjoin=BaseIdeaWidgetLink.idea,
    uselist=False)


class GeneratedIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'generated_idea_widget_link',
    }

IdeaCreatingWidget.generated_idea_links = relationship(GeneratedIdeaWidgetLink)

IdeaCreatingWidget.generated_ideas = relationship(
    Idea, viewonly=True, secondary=GeneratedIdeaWidgetLink.__table__,
    primaryjoin=IdeaCreatingWidget.idea_links.of_type(GeneratedIdeaWidgetLink),
    secondaryjoin=GeneratedIdeaWidgetLink.idea)


class VotableIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'votable_idea_widget_link',
    }

MultiCriterionVotingWidget.votable_idea_links = relationship(
    VotableIdeaWidgetLink)
Idea.has_votable_links = relationship(VotableIdeaWidgetLink)

MultiCriterionVotingWidget.votable_ideas = relationship(
    Idea, viewonly=True, secondary=VotableIdeaWidgetLink.__table__,
    primaryjoin=MultiCriterionVotingWidget.idea_links.of_type(
        VotableIdeaWidgetLink), secondaryjoin=VotableIdeaWidgetLink.idea,
    backref='votable_by_widget')


class VotedIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'voted_idea_widget_link',
    }

MultiCriterionVotingWidget.voted_idea_links = relationship(
    VotedIdeaWidgetLink)

MultiCriterionVotingWidget.voted_ideas = relationship(
    Idea, viewonly=True, secondary=VotedIdeaWidgetLink.__table__,
    primaryjoin=MultiCriterionVotingWidget.idea_links.of_type(
        VotedIdeaWidgetLink), secondaryjoin=VotedIdeaWidgetLink.idea,
    backref="voted_by_widget")


class VotingCriterionWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'criterion_widget_link',
    }

MultiCriterionVotingWidget.criteria_links = relationship(
    VotingCriterionWidgetLink, backref="voting_widget")
Idea.has_criterion_links = relationship(VotingCriterionWidgetLink)

MultiCriterionVotingWidget.criteria = relationship(
    Idea,
    viewonly=True, secondary=VotingCriterionWidgetLink.__table__,
    primaryjoin=MultiCriterionVotingWidget.idea_links.of_type(VotingCriterionWidgetLink),
    secondaryjoin=VotingCriterionWidgetLink.idea,
    backref='criterion_of_widget')
