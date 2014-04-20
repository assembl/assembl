from sqlalchemy import (
    Column, Integer, ForeignKey, Text, String)
from sqlalchemy.orm import relationship

from ..lib.sqla import Base
from .synthesis import (Discussion, ExplicitSubGraphView)
from ..auth import P_ADD_POST, P_ADMIN_DISC, CrudPermissions
from .auth import User


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
            view = ExplicitSubGraphView(discussion=self.discussion)
            self.main_idea_view = view
            self.db.add(view)
        return self.main_idea_view

    def get_discussion_id(self):
        return self.discussion_id

    # extra columns: We'd like user_configs to
    # filter on id of user vs widgetuserconfig...
    # Also, can we filter on main_idea_view w/o the id?

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

    settings = Column(Text)  # JSON blob

    def get_discussion_id(self):
        return self.widget.discussion_id

    crud_permissions = CrudPermissions(P_ADD_POST)  # all participants...
