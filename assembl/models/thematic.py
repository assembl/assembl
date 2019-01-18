from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)

from ..auth import CrudPermissions, P_ADMIN_DISC, P_READ
from .idea import Idea


class Question(Idea):
    """
    A question in a thematic for phase 1.
    """
    __tablename__ = "question"
    __mapper_args__ = {
        'polymorphic_identity': 'question',
    }

    id = Column(Integer, ForeignKey(
        Idea.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)
