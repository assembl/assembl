from itertools import chain
from datetime import datetime

from sqlalchemy import (
    Column, Integer, ForeignKey, Text, String, DateTime, inspect)
from sqlalchemy.sql import text, column
from sqlalchemy.orm import (
    relationship, backref, aliased, join)
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
from .votes import AbstractVoteSpecification, AbstractIdeaVote
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

    start_date = Column(DateTime, server_default=None)
    end_date = Column(DateTime, server_default=None)

    def __init__(self, *args, **kwargs):
        super(Widget, self).__init__(*args, **kwargs)
        self.interpret_settings(self.settings_json)

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

    def update_from_json(self, json, user_id=None, context=None, jsonld=None,
                         parse_def_name='default_reverse'):
        modified = super(Widget, self).update_from_json(
            json, user_id, context, jsonld, parse_def_name)

        if user_id and user_id != Everyone and 'user_state' in json:
            modified.set_user_state(json['user_state'], user_id)
        return modified

    @classmethod
    def filter_started(cls, query):
        return query.filter(
            (cls.start_date == None) | (cls.start_date <= datetime.utcnow()))

    @classmethod
    def test_active(cls):
        now = datetime.utcnow()
        return ((cls.end_date == None) | (cls.end_date > now)
                & (cls.start_date == None) | (cls.start_date <= now))

    @classmethod
    def filter_active(cls, query):
        return query.filter(cls.test_active())

    def is_started(self):
        return self.start_date == None or self.start_date <= datetime.utcnow()

    def is_ended(self):
        return self.end_date != None and self.end_date < datetime.utcnow()

    def is_active(self):
        return self.is_started() and not self.is_ended()

    @property
    def activity_state(self):
        if not self.is_started():
            return "not started"
        if self.is_ended():
            return "ended"
        return "active"

    @classmethod
    def test_ended(cls):
        return (cls.end_date != None) | (cls.end_date < datetime.utcnow())

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


class IdeaWidgetLink(DiscussionBoundBase):
    __tablename__ = 'idea_widget_link'

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    type = Column(String(60))

    idea_id = Column(Integer, ForeignKey(Idea.id),
                     nullable=False, index=True)
    idea = relationship(
        Idea, primaryjoin=(Idea.id == idea_id),
        backref=backref("widget_links", cascade="all, delete-orphan"))

    widget_id = Column(Integer, ForeignKey(
        Widget.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    widget = relationship(Widget, backref=backref(
        'idea_links', cascade="all, delete-orphan"))

    context_url = Column(String())

    __mapper_args__ = {
        'polymorphic_identity': 'abstract_idea_widget_link',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

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


# Note: declare all subclasses of IdeaWidgetLink here,
# so we can use polymorphic_test later.

class BaseIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'base_idea_widget_link',
    }


class GeneratedIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'generated_idea_widget_link',
    }


class IdeaShowingWidgetLink(IdeaWidgetLink):
    "Widgets that should show up in the IdeaPanel"
    __mapper_args__ = {
        'polymorphic_identity': 'idea_showing_widget_link',
    }


class IdeaDescendantsShowingWidgetLink(IdeaShowingWidgetLink):
    "Widgets that should show up in the IdeaPanel "
    "of an idea and its descendants"
    __mapper_args__ = {
        'polymorphic_identity': 'idea_desc_showing_widget_link',
    }


class IdeaInspireMeWidgetLink(
        BaseIdeaWidgetLink, IdeaDescendantsShowingWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_inspire_me_widget_link',
    }



class IdeaCreativitySessionWidgetLink(
        BaseIdeaWidgetLink, IdeaShowingWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_creativity_session_widget_link',
    }


class VotableIdeaWidgetLink(IdeaShowingWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'votable_idea_widget_link',
    }


class VotedIdeaWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'voted_idea_widget_link',
    }


class VotingCriterionWidgetLink(IdeaWidgetLink):
    __mapper_args__ = {
        'polymorphic_identity': 'criterion_widget_link',
    }


# Then declare relationships

Idea.widgets = association_proxy('widget_links', 'widget')

Widget.showing_idea_links = relationship(
    IdeaWidgetLink,
    primaryjoin=((Widget.id == IdeaShowingWidgetLink.widget_id)
                 & IdeaShowingWidgetLink.polymorphic_test()))
Idea.has_showing_widget_links = relationship(
    IdeaWidgetLink,
    primaryjoin=((Idea.id == IdeaShowingWidgetLink.idea_id)
                 & IdeaShowingWidgetLink.polymorphic_test()))

Widget.showing_ideas = relationship(
    Idea, viewonly=True, secondary=IdeaShowingWidgetLink.__table__,
    primaryjoin=((Widget.id == IdeaShowingWidgetLink.widget_id)
                 & IdeaShowingWidgetLink.polymorphic_test()),
    secondaryjoin=IdeaShowingWidgetLink.idea_id == Idea.id,
    backref='showing_widget')


Idea.active_showing_widget_links = relationship(
    IdeaWidgetLink, viewonly=True,
    primaryjoin=((IdeaShowingWidgetLink.idea_id == Idea.id)
                 & IdeaShowingWidgetLink.polymorphic_test()
                 & (IdeaShowingWidgetLink.widget_id == Widget.id)
                 & Widget.test_active()))


class BaseIdeaWidget(Widget):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_view_widget',
    }

    base_idea_link = relationship(BaseIdeaWidgetLink, uselist=False)
    base_idea_link_class = BaseIdeaWidgetLink

    def interpret_settings(self, settings):
        if 'idea' in settings:
            self.set_base_idea_id(Idea.get_database_id(settings['idea']))

    def base_idea_id(self):
        if self.base_idea_link:
            return self.base_idea_link.idea_id

    def set_base_idea_id(self, id):
        idea = Idea.get_instance(id)
        if self.base_idea_link:
            self.base_idea_link.idea_id = id
        else:
            self.base_idea_link = self.base_idea_link_class(
                widget=self, idea=idea)
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


BaseIdeaWidget.base_idea = relationship(
        Idea, viewonly=True, secondary=BaseIdeaWidgetLink.__table__,
        primaryjoin=((BaseIdeaWidget.id == BaseIdeaWidgetLink.widget_id)
                     & BaseIdeaWidgetLink.polymorphic_test()),
        secondaryjoin=BaseIdeaWidgetLink.idea_id == Idea.id,
        uselist=False)


class BaseIdeaCollection(CollectionDefinition):
    def __init__(self):
        super(BaseIdeaCollection, self).__init__(
            BaseIdeaWidget, BaseIdeaWidget.base_idea)

    def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
        widget = owner_alias
        idea = last_alias
        return query.join(
            BaseIdeaWidgetLink,
            idea.id == BaseIdeaWidgetLink.idea_id).join(
                widget).filter(widget.id == parent_instance.id).filter(
                    widget.id == BaseIdeaWidgetLink.widget_id,
                    BaseIdeaWidgetLink.polymorphic_test())


class BaseIdeaDescendantsCollection(AbstractCollectionDefinition):
    descendants = text("""SELECT id from (SELECT target_id as id FROM (
                SELECT transitive t_in (1) t_out (2) T_DISTINCT T_NO_CYCLES
                    target_id, source_id FROM idea_idea_link WHERE tombstone_date IS NULL
                ) il
            WHERE il.source_id = :base_idea_id
            UNION SELECT :base_idea_id as id) recid"""
    ).columns(column('id'))

    def __init__(self):
        super(BaseIdeaDescendantsCollection, self).__init__(
            BaseIdeaWidget, Idea)

    def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
        widget = owner_alias
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
        descendant = aliased(Idea, name="descendant")
        base_idea = aliased(Idea, name="base_idea")
        # using base_idea_id() is cheating, but a proper join fails.
        descendants_subq = self.descendants.bindparams(
            base_idea_id=parent_instance.base_idea_id()).alias()
        query = instance.db.query(descendant).filter(
            descendant.id.in_(descendants_subq)).join(
            Widget, Widget.id == parent_instance.id)
        return query.count() > 0

    def decorate_instance(
            self, instance, parent_instance, assocs, user_id,
            ctx, kwargs):
        pass


class IdeaCreatingWidget(BaseIdeaWidget):
    __mapper_args__ = {
        'polymorphic_identity': 'idea_creating_widget',
    }

    generated_idea_links = relationship(GeneratedIdeaWidgetLink)

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

    def get_num_ideas(self):
        return len(self.generated_idea_links)

    def set_confirmed_ideas(self, idea_ids):
        for idea in self.generated_ideas:
            uri = idea.uri()
            hide = uri not in idea_ids
            idea.hidden = hide
            # p = idea.proposed_in_post
            # if p:
            #     p.hidden = hide

    def get_confirmed_messages(self):
        root_idea_id = self.base_idea_id()
        ids = self.db.query(Content.id).join(
            IdeaContentWidgetLink).join(
            Idea, IdeaContentWidgetLink.idea_id == Idea.id).join(
            IdeaLink, IdeaLink.target_id == Idea.id).filter(
            IdeaLink.source_id == root_idea_id, ~Content.hidden
            ).union(
                self.db.query(IdeaProposalPost.id).join(
                    Idea, IdeaProposalPost.idea_id == Idea.id).join(
                    IdeaLink, IdeaLink.target_id == Idea.id).filter(
                    IdeaLink.source_id == root_idea_id,
                    ~IdeaProposalPost.hidden)
            ).all()
        return [Content.uri_generic(id) for (id,) in ids]

    def set_confirmed_messages(self, post_ids):
        root_idea_id = self.base_idea_id()
        for post in self.db.query(Content).join(
                IdeaContentWidgetLink).join(
                Idea, IdeaContentWidgetLink.idea_id == Idea.id).join(
                IdeaLink, IdeaLink.target_id == Idea.id).filter(
                IdeaLink.source_id == root_idea_id).all():
            post.hidden = (post.uri() not in post_ids)
        for post in self.db.query(IdeaProposalPost).join(
                Idea, IdeaProposalPost.idea_id == Idea.id).join(
                IdeaLink, IdeaLink.target_id == Idea.id).filter(
                IdeaLink.source_id == root_idea_id).all():
            post.hidden = (post.uri() not in post_ids)

    def get_ideas_hiding_url(self):
        return 'local:Discussion/%d/widgets/%d/base_idea_hiding/-/children' % (
            self.discussion_id, self.id)

    @classmethod
    def extra_collections(cls):
        class BaseIdeaCollectionC(BaseIdeaCollection):
            hide_proposed_ideas = False

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                query = super(BaseIdeaCollectionC, self).decorate_query(
                    query, owner_alias, last_alias, parent_instance, ctx)
                children_ctx = ctx.find_collection(
                    'ChildIdeaCollectionDefinition')
                if children_ctx:
                    gen_idea_link = aliased(GeneratedIdeaWidgetLink)
                    query = query.join(
                        gen_idea_link,
                        (gen_idea_link.idea_id ==
                            children_ctx.class_alias.id) & (
                        gen_idea_link.widget_id == owner_alias.id))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                super(BaseIdeaCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        inst.hidden = self.hide_proposed_ideas
                        post = IdeaProposalPost(
                            proposes_idea=inst, creator_id=user_id,
                            discussion_id=inst.discussion_id,
                            message_id=uuid.uuid1().urn,
                            hidden=self.hide_proposed_ideas,
                            subject=inst.short_title,
                            body=instance.definition or '',  # repeated
                            **self.filter_kwargs(
                                IdeaProposalPost, kwargs))
                        assocs.append(post)
                        assocs.append(IdeaContentWidgetLink(
                            content=post, idea=inst,
                            creator_id=user_id,
                            **self.filter_kwargs(
                                IdeaContentWidgetLink, kwargs)))
                        assocs.append(GeneratedIdeaWidgetLink(
                            idea=inst,
                            **self.filter_kwargs(
                                GeneratedIdeaWidgetLink, kwargs)))

        class BaseIdeaHidingCollection(BaseIdeaCollectionC):
            hide_proposed_ideas = True

            def ctx_permissions(self, permissions):
                # permission loophoole: allow participants to create ideas in this case.
                if P_ADD_POST in permissions and P_ADD_IDEA not in permissions:
                    return [P_ADD_IDEA]
                return super(BaseIdeaHidingCollection, self).ctx_permissions(permissions)


        class BaseIdeaDescendantsCollectionC(BaseIdeaDescendantsCollection):
            hide_proposed_ideas = False

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                query = super(BaseIdeaDescendantsCollectionC, self).decorate_query(
                    query, owner_alias, last_alias, parent_instance, ctx)
                children_ctx = ctx.find_collection(
                    'ChildIdeaCollectionDefinition')
                if children_ctx:
                    gen_idea_link = aliased(GeneratedIdeaWidgetLink)
                    query = query.join(
                        gen_idea_link,
                        (gen_idea_link.idea_id ==
                            children_ctx.class_alias.id))
                return query

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                super(BaseIdeaDescendantsCollectionC, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)
                for inst in assocs[:]:
                    if isinstance(inst, Idea):
                        inst.hidden = self.hide_proposed_ideas
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
                            content=post, idea=inst,
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


IdeaCreatingWidget.generated_ideas = relationship(
    Idea, viewonly=True, secondary=GeneratedIdeaWidgetLink.__table__,
    primaryjoin=((IdeaCreatingWidget.id == GeneratedIdeaWidgetLink.widget_id)
                 & GeneratedIdeaWidgetLink.polymorphic_test()),
    secondaryjoin=GeneratedIdeaWidgetLink.idea_id == Idea.id)


class InspirationWidget(IdeaCreatingWidget):
    default_view = 'creativity_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'inspiration_widget',
    }
    base_idea_link_class = IdeaInspireMeWidgetLink

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
        return "/static/widget/session/#home"

    def set_base_idea_id(self, id):
        idea = Idea.get_instance(id)
        if self.base_idea_link:
            self.base_idea_link.idea_id = id
        else:
            self.base_idea_link = IdeaCreativitySessionWidgetLink(widget=self, idea=idea)
            self.db.add(self.base_idea_link)
        # This is wrong, but not doing it fails.
        self.base_idea = idea

    def notification_data(self, data):
        end = data.get('end', None)
        time_to_end = (datetime.strptime(end, ISO_8601_FORMAT) - datetime.utcnow()
                       ).total_seconds() if end else None
        return dict(
            data,
            widget_url=self.uri(),
            time_to_end=time_to_end,
            num_participants=self.num_participants(),
            num_ideas=len(self.generated_idea_links))

    def num_participants(self):
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
        return len(participant_ids)

    def get_add_post_endpoint(self, idea):
        return 'local:Discussion/%d/widgets/%d/base_idea/-/children/%d/widgetposts' % (
            self.discussion_id, self.id, idea.id)


class MultiCriterionVotingWidget(BaseIdeaWidget):
    default_view = 'voting_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'multicriterion_voting_widget',
    }

    votable_idea_links = relationship(VotableIdeaWidgetLink)
    voted_idea_links = relationship(VotedIdeaWidgetLink)
    criteria_links = relationship(
        VotingCriterionWidgetLink, backref="voting_widget")

    @classmethod
    def get_ui_endpoint_base(cls):
        # TODO: Make this configurable.
        return "/static/widget/vote/"

    def interpret_settings(self, settings):
        if "idea" not in settings and "votable_root_id" in settings:
            settings["idea"] = settings["votable_root_id"]
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
    def votespecs_url(self):
        return 'local:Discussion/%d/widgets/%d/vote_specifications' % (
            self.discussion_id, self.id)

    @property
    def votables_url(self):
        return 'local:Discussion/%d/widgets/%d/targets/' % (
            self.discussion_id, self.id)

    def get_user_votes_url(self, idea_id):
        return 'local:Discussion/%d/widgets/%d/targets/%d/votes' % (
            self.discussion_id, self.id, Idea.get_database_id(idea_id))

    def all_voting_results(self):
        return {
            spec.uri(): spec.voting_results()
            for spec in self.vote_specifications
        }

    def get_voting_urls(self, target_idea_id):
        # TODO: Does not work yet.
        return {
            AbstractVoteSpecification.uri_generic(vote_spec.id):
            'local:Discussion/%d/widgets/%d/vote_specifications/%d/vote_targets/%d/votes' % (
                self.discussion_id, self.id, vote_spec.id,
                Idea.get_database_id(target_idea_id))
            for vote_spec in self.vote_specifications
        }

    def get_voting_results_by_spec_url(self):
        return {
            AbstractVoteSpecification.uri_generic(vote_spec.id):
            'local:Discussion/%d/widgets/%d/vote_specifications/%d/vote_results' % (
                self.discussion_id, self.id, vote_spec.id)
            for vote_spec in self.vote_specifications
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
        class CriterionCollection(CollectionDefinition):
            # The set of voting criterion ideas.
            # Not to be confused with http://www.criterion.com/
            def __init__(self, cls):
                super(CriterionCollection, self).__init__(
                    cls, cls.criteria)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                widget = owner_alias
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

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                widget = owner_alias
                idea = last_alias
                query = query.join(idea.has_votable_links).join(
                    widget).filter(widget.id == parent_instance.id)
                # This is unhealthy knowledge, but best I can do now.
                vote_coll = ctx.find_collection('CollectionDefinition.votes')
                if vote_coll:
                    query = query.filter(
                        vote_coll.class_alias.widget_id ==
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
        widget = self.widget or Widget.get(self.widget_id)
        return widget.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.widget_id == Widget.id),
                (Widget.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Widget.__table__,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    crud_permissions = CrudPermissions(P_ADD_POST)  # all participants...



Idea.has_votable_links = relationship(VotableIdeaWidgetLink)
Idea.has_criterion_links = relationship(VotingCriterionWidgetLink)

MultiCriterionVotingWidget.votable_ideas = relationship(
    Idea, viewonly=True, secondary=VotableIdeaWidgetLink.__table__,
    primaryjoin=((MultiCriterionVotingWidget.id == VotableIdeaWidgetLink.widget_id)
                 & VotableIdeaWidgetLink.polymorphic_test()),
    secondaryjoin=VotableIdeaWidgetLink.idea_id == Idea.id,
    backref='votable_by_widget')

MultiCriterionVotingWidget.voted_ideas = relationship(
    Idea, viewonly=True, secondary=VotedIdeaWidgetLink.__table__,
    primaryjoin=((MultiCriterionVotingWidget.id == VotedIdeaWidgetLink.widget_id)
                 & VotedIdeaWidgetLink.polymorphic_test()),
    secondaryjoin=VotedIdeaWidgetLink.idea_id == Idea.id,
    backref="voted_by_widget")

MultiCriterionVotingWidget.criteria = relationship(
    Idea,
    viewonly=True, secondary=VotingCriterionWidgetLink.__table__,
    primaryjoin=((MultiCriterionVotingWidget.id == VotingCriterionWidgetLink.widget_id)
                 & VotingCriterionWidgetLink.polymorphic_test()),
    secondaryjoin=VotingCriterionWidgetLink.idea_id == Idea.id,
    backref='criterion_of_widget')
