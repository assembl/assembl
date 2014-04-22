from sqlalchemy import (
    Column, Integer, ForeignKey, Text, String)
from sqlalchemy.orm import relationship
import simplejson as json

from ..lib.sqla import Base
from .synthesis import (
    Discussion, ExplicitSubGraphView, SubGraphIdeaAssociation, Idea)
from ..auth import P_ADD_POST, P_ADMIN_DISC, Everyone, CrudPermissions
from .auth import User
from ..views.traversal import CollectionDefinition


class Widget(Base):
    __tablename__ = "widget"

    id = Column(Integer, primary_key=True)

    type = Column(String(60), nullable=False)
    widget_type = Column(String(120), nullable=False)

    settings = Column(Text)  # JSON blob
    state = Column(Text)  # JSON blob

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    discussion = relationship(Discussion, backref="widgets")

    main_idea_view_id = Column(
        Integer,
        ForeignKey('idea_graph_view.id',
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True
    )
    main_idea_view = relationship('IdeaGraphView')

    __mapper_args__ = {
        'polymorphic_identity': 'widget',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
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

    def get_discussion_id(self):
        return self.discussion_id

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
            return 'local:Discussion/%d/widgets/%d/main_idea_view/-/ideas/%d/widgetposts' % (
                self.discussion_id, self.id, Idea.get_database_id(idea_uri))

    @classmethod
    def extra_collections(cls):
        class WidgetViewCollection(CollectionDefinition):
            def __init__(self):
                super(WidgetViewCollection, self).__init__(
                    cls, cls.main_idea_view.property)

            def decorate_instance(self, instance, parent_instance, assocs):
                super(WidgetViewCollection, self).decorate_instance(
                    instance, parent_instance, assocs)
                for inst in assocs:
                    if isinstance(inst, Idea):
                        # TODO: Add that column in Idea
                        idea.status = 'widget'

        return {'main_idea_view': WidgetViewCollection()}

    def update_json(self, json, user_id=Everyone):
        from ..auth.util import user_has_permission
        if 'state' in json:
            self.state_json = json['state']
        if user_has_permission(self.discussion_id, user_id, P_ADMIN_DISC):
            if 'settings' in json:
                self.settings_json = json['settings']
            self.widget_type = json.get('widget_type', self.widget_type)
            if 'discussion' in json:
                self.discussion = Discussion.get_instance(json['discussion'])
        # Later
        # if user_id and 'user_state' in json:
        #     old_state = self.db.query(WidgetUserConfig).filter_by(
        #         widget = self, user_id = user_id).first()
        #     if old_state:
        #         old_state.update_json(json['user_state'])
        #     else:
        #         state = WidgetUserConfig(widget = self, user_id = user_id)
        #         state.state_json = json['user_state']
        #         self.db.add(state)

    crud_permissions = CrudPermissions(P_ADMIN_DISC)


class WidgetUserConfig(Base):
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

    crud_permissions = CrudPermissions(P_ADD_POST)  # all participants...
