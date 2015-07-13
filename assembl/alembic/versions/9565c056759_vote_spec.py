"""vote_spec

Revision ID: 9565c056759
Revises: df96058e0fa
Create Date: 2015-06-16 16:13:38.479667

"""

# revision identifiers, used by Alembic.
revision = '9565c056759'
down_revision = 'df96058e0fa'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla import mark_changed

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
        # Transfer idea_vote data to a temporary table
        op.create_table(
            "idea_vote_temp",
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('base_id', sa.Integer),
            sa.Column('type', sa.String(60)),
            sa.Column('tombstone_date', sa.DateTime),
            sa.Column('idea_id', sa.Integer),
            sa.Column('vote_spec_id', sa.Integer),
            sa.Column('criterion_id', sa.Integer),
            sa.Column('vote_date', sa.DateTime),
            sa.Column('voter_id', sa.Integer),
            sa.Column('widget_id', sa.Integer))
        op.execute("""INSERT INTO idea_vote_temp (
            id, base_id, type, tombstone_date, idea_id, vote_spec_id,
            criterion_id, vote_date, voter_id, widget_id)
            SELECT id, base_id, type, tombstone_date, idea_id, NULL,
            criterion_id, vote_date, voter_id, widget_id from idea_vote""")
        op.execute("""DELETE FROM idea_vote""")
        # So I can add a non-nullable column
        op.add_column(
            "idea_vote",
            sa.Column(
                "vote_spec_id", sa.Integer,
                sa.ForeignKey("vote_specification.id",
                              ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False))
        mark_changed()

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        specs = {}
        # We need the widget to be in the ORM
        widget_by_id = {w.id: w for w in db.query(
            m.MultiCriterionVotingWidget).all()}
        for (widget_id, idea_id) in db.execute(
                """SELECT widget_id, idea_id FROM idea_widget_link
                WHERE "type" = 'criterion_widget_link' """):
            spec = m.LickertVoteSpecification(
                widget=widget_by_id[widget_id],
                criterion_idea_id=idea_id,
                minimum=0, maximum=1, question_id=0)
            db.add(spec)
            specs[(widget_id, idea_id)] = spec
        db.flush()
        for vote_id, widget_id, criterion_id in db.execute(
                "SELECT id, widget_id, criterion_id FROM idea_vote_temp"):
            vote_spec = specs.get((widget_id, criterion_id), None)
            if vote_spec:
                db.execute("UPDATE idea_vote_temp SET vote_spec_id = %d"
                           " WHERE id = %d" % (vote_spec.id, vote_id))
            else:
                db.execute("DELETE FROM idea_vote WHERE id = %d" % (vote_id,))
        mark_changed()
    with context.begin_transaction():
        op.execute("""INSERT INTO idea_vote (
            id, base_id, type, tombstone_date, idea_id, vote_spec_id,
            criterion_id, vote_date, voter_id, widget_id)
            SELECT id, base_id, type, tombstone_date, idea_id, vote_spec_id,
            criterion_id, vote_date, voter_id, widget_id
            FROM idea_vote_temp""")
        op.drop_table("idea_vote_temp")
        mark_changed()
        # In a separate migration:
        # op.drop_column('idea_vote', 'criterion_id')



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("multiple_choice_idea_vote")
        op.drop_table("multiple_choice_vote_specification")
        op.drop_table("lickert_vote_specification")
        op.drop_column("idea_vote", "vote_spec_id")
        op.drop_table("vote_specification")
