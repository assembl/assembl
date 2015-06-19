"""vote_spec

Revision ID: 9565c056759
Revises: 163294913218
Create Date: 2015-06-16 16:13:38.479667

"""

# revision identifiers, used by Alembic.
revision = '9565c056759'
down_revision = '163294913218'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "vote_specification",
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('widget_id', sa.Integer,
                      sa.ForeignKey("widget.id"), nullable=False),
            sa.Column('criterion_idea_id', sa.Integer,
                      sa.ForeignKey("idea.id"), nullable=True),
            sa.Column('question_id', sa.Integer, nullable=False),
            sa.Column('settings', sa.Text))
        op.create_table(
            "lickert_vote_specification",
            sa.Column("id", sa.Integer,
                      sa.ForeignKey("vote_specification.id"),
                      primary_key=True),
            sa.Column("minimum", sa.Integer),
            sa.Column("maximum", sa.Integer))
        op.create_table(
            "multiple_choice_vote_specification",
            sa.Column("id", sa.Integer,
                      sa.ForeignKey("vote_specification.id"),
                      primary_key=True),
            sa.Column("num_choices", sa.Integer, nullable=False))
        op.create_table(
            "multiple_choice_idea_vote",
            sa.Column(
                "id", sa.Integer,
                sa.ForeignKey("idea_vote.id",
                              ondelete="CASCADE", onupdate="CASCADE"),
                primary_key=True),
            sa.Column("vote_value", sa.Integer, nullable=False))
        op.add_column(
            "idea_vote",
            sa.Column(
                "vote_spec_id", sa.Integer,
                sa.ForeignKey("vote_specification.id",
                              ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("multiple_choice_idea_vote")
        op.drop_table("multiple_choice_vote_specification")
        op.drop_table("lickert_vote_specification")
        op.drop_column("idea_vote", "vote_spec_id")
        op.drop_table("vote_specification")
