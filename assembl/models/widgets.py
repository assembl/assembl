from itertools import chain

from sqlalchemy import (
    Column, Integer, ForeignKey, Text, String)
from sqlalchemy.orm import relationship
import simplejson as json
import uuid

from . import DiscussionBoundBase
from .synthesis import (
    Discussion, ExplicitSubGraphView, SubGraphIdeaAssociation, Idea,
    IdeaContentWidgetLink, IdeaLink)
from .generic import Content
from .post import IdeaProposalPost
from ..auth import P_ADD_POST, P_ADMIN_DISC, Everyone, CrudPermissions
from .auth import User
from ..views.traversal import CollectionDefinition


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
    discussion = relationship(Discussion, backref="widgets")

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    def get_user_states_uri(self):
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

    @property
    def state_json(self):
        if self.state:
            return json.loads(self.state)
        return {}

    @state_json.setter
    def state_json(self, val):
        self.state = json.dumps(val)

    def get_user_state(self, user_id):
        return self.db.query(WidgetUserConfig).filter_by(
            widget = self, user_id = user_id).first()

    def update_json(self, json, user_id=Everyone):
        from ..auth.util import user_has_permission
        if user_has_permission(self.discussion_id, user_id, P_ADMIN_DISC):
            new_type = json.get('@type', self.type)
            if self.type != new_type:
                polymap = inspect(self.__class__).polymorphic_identity
                if new_type not in polymap:
                    return None
                new_type = polymap[new_type].class_
                new_instance = self.change_class(new_type)
                return new_instance.update_json(json)
            if 'settings' in json:
                self.settings_json = json['settings']
            if 'discussion' in json:
                self.discussion = Discussion.get_instance(json['discussion'])
        if 'state' in json:
            self.state_json = json['state']
        if user_id and user_id != Everyone and 'user_state' in json:
            old_state = self.db.query(WidgetUserConfig).filter_by(
                widget = self, user_id = user_id).first()
            if old_state:
                old_state.update_json(json['user_state'])
            else:
                state = WidgetUserConfig(widget = self, user_id = user_id)
                state.state_json = json['user_state']
                self.db.add(state)
        return self

    crud_permissions = CrudPermissions(P_ADMIN_DISC)


class IdeaViewWidget(Widget):
    __tablename__ = "idea_view_widget"

    id = Column(Integer, ForeignKey(
        'widget.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    main_idea_view_id = Column(
        Integer,
        ForeignKey('idea_graph_view.id',
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True
    )
    main_idea_view = relationship('IdeaGraphView')

    __mapper_args__ = {
        'polymorphic_identity': 'idea_view_widget',
    }

    def get_idea_view(self):
        if self.main_idea_view_id is None:
            assert self.discussion
            view = ExplicitSubGraphView(discussion=self.discussion)
            self.main_idea_view = view
            self.db.add(view)
            idea_uri = self.settings_json.get('idea', None)
            if idea_uri:
                self.db.add(SubGraphIdeaAssociation(
                    idea=Idea.get_instance(idea_uri), sub_graph=view))
            self.db.flush()
        return self.main_idea_view

    def get_ideas_uri(self):
        uri = 'local:Discussion/%d/widgets/%d/main_idea_view/-/ideas' % (
            self.discussion_id, self.id)
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            uri += '/%d/children' % (Idea.get_database_id(idea_uri), )
        return uri

    def get_messages_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return ('local:Discussion/%d/widgets/%d/main_idea_view'
                    '/-/ideas/%d/widgetposts') % (
                        self.discussion_id, self.id,
                        Idea.get_database_id(idea_uri))

    def get_confirm_ideas_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return ('local:Discussion/%d/widgets/%d/confirm_ideas') % (
                self.discussion_id, self.id)

    def get_confirm_messages_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return ('local:Discussion/%d/widgets/%d/confirm_messages') % (
                self.discussion_id, self.id)

    @property
    def main_idea_id(self):
        return self.settings_json.get('idea', None)

    @property
    def main_idea(self):
        idea_id = self.main_idea_id
        if idea_id:
            return Idea.get_instance(idea_id)

    def get_confirmed_ideas(self):
        root_idea_uri = self.main_idea_id
        # TODO : optimize
        ideas = self.main_idea_view.ideas
        return [idea.uri() for idea in ideas
                if (not idea.hidden) and idea.uri() != root_idea_uri]

    def set_confirmed_ideas(self, idea_ids):
        root_idea_uri = self.main_idea_id
        # TODO : optimize
        for idea in self.main_idea_view.ideas:
            uri = idea.uri()
            if uri == root_idea_uri:
                continue
            idea.hidden = (uri not in idea_ids)

    def get_confirmed_messages(self):
        root_idea_uri = self.main_idea_id
        root_idea_id = Idea.get_database_id(root_idea_uri)
        ids = self.db.query(Content.id).join(
            IdeaContentWidgetLink).join(Idea).join(
                IdeaLink, IdeaLink.target_id == Idea.id).filter(
                    IdeaLink.source_id == root_idea_id
                ).filter(~Content.hidden).all()
        return [Content.uri_generic(id) for (id,) in ids]

    def set_confirmed_messages(self, post_ids):
        root_idea_uri = self.main_idea_id
        root_idea_id = Idea.get_database_id(root_idea_uri)
        for post in self.db.query(Content).join(IdeaContentWidgetLink).join(
                Idea).join(IdeaLink, IdeaLink.target_id == Idea.id).filter(
                IdeaLink.source_id == root_idea_id).all():
            post.hidden = (post.uri() not in post_ids)

    @classmethod
    def extra_collections(cls):
        class WidgetViewCollection(CollectionDefinition):
            def __init__(self):
                super(WidgetViewCollection, self).__init__(
                    cls, cls.main_idea_view.property)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id):
                super(WidgetViewCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id)
                for inst in chain(assocs[:], (instance,)):
                    if isinstance(inst, Idea):
                        inst.hidden = True
                        post = IdeaProposalPost(
                            proposes_idea=inst, creator_id=user_id,
                            discussion_id=inst.discussion_id,
                            message_id=uuid.uuid1().urn,
                            body="", subject=inst.short_title)
                        assocs.append(post)
                        assocs.append(IdeaContentWidgetLink(
                            content=post, idea=inst.parents[0],
                            creator_id=user_id))

        return {'main_idea_view': WidgetViewCollection()}


class CreativityWidget(IdeaViewWidget):
    default_view = 'creativity_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'creativity_widget',
    }


# These do not seem to be distinguished yet.
# class CardGameWidget(CreativityWidget):
#     __mapper_args__ = {
#         'polymorphic_identity': 'cardgame_widget',
#     }


# class JukeTubeWidget(CreativityWidget):
#     __mapper_args__ = {
#         'polymorphic_identity': 'juketube_widget',
#     }


class MultiCriterionVotingWidget(Widget):
    default_view = 'voting_widget'
    __mapper_args__ = {
        'polymorphic_identity': 'multicriterion_voting_widget',
    }

    def get_criteria_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return 'local:Idea/%d/criteria' % (
                Idea.get_database_id(idea_uri),)

    def get_user_votes_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return 'local:Idea/%d/votes' % (
                Idea.get_database_id(idea_uri),)

    def get_vote_results_uri(self):
        idea_uri = self.settings_json.get('idea', None)
        if idea_uri:
            return 'local:Idea/%d/vote_results' % (
                Idea.get_database_id(idea_uri),)

    @property
    def main_idea_id(self):
        return self.settings_json.get('idea', None)

    @property
    def main_idea(self):
        idea_id = self.main_idea_id
        if idea_id:
            return Idea.get_instance(idea_id)


class WidgetUserConfig(DiscussionBoundBase):
    __tablename__ = "widget_user_config"

    id = Column(Integer, primary_key=True)

    widget_id = Column(
        Integer,
        ForeignKey('widget.id',
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    widget = relationship(Widget, backref="user_configs")

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
    def get_discussion_condition(cls, discussion_id):
        return (cls.widget_id == Widget.id) & (
            Widget.discussion_id == discussion_id)

    crud_permissions = CrudPermissions(P_ADD_POST)  # all participants...
