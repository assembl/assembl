"""token votes

Revision ID: 11d73c586596
Revises: 4dcf98a132de
Create Date: 2016-03-15 14:48:55.667464

"""

# revision identifiers, used by Alembic.
revision = '11d73c586596'
down_revision = '4dcf98a132de'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config



def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "token_vote_specification",
            sa.Column("id", sa.Integer, sa.ForeignKey(
                "vote_specification.id"), primary_key=True),
            sa.Column("exclusive_categories", sa.Boolean))

        op.create_table(
            "token_category_specification",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("total_number", sa.Integer, nullable=False),
            sa.Column("maximum_per_idea", sa.Integer),
            sa.Column("name_ls_id", sa.Integer, sa.ForeignKey(
                "langstring.id"), nullable=False),
            sa.Column("typename", sa.String, nullable=False),
            sa.Column("image", sa.String),
            sa.Column("token_vote_specification_id", sa.Integer, sa.ForeignKey(
                    "token_vote_specification.id", ondelete='CASCADE',
                    onupdate='CASCADE'),
                nullable=False),
            sa.schema.UniqueConstraint(
                "token_vote_specification_id", "typename"))

        op.create_table(
            "token_idea_vote",
            sa.Column(
                "id", sa.Integer, sa.ForeignKey(
                    "idea_vote.id", ondelete='CASCADE',
                    onupdate='CASCADE'),
                primary_key=True),
            sa.Column("vote_value", sa.Integer, nullable=False),
            sa.Column(
                "token_category_id", sa.Integer, sa.ForeignKey(
                    "token_category_specification.id", ondelete='CASCADE',
                    onupdate='CASCADE')))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("token_idea_vote")
        op.drop_table("token_category_specification")
        op.drop_table("token_vote_specification")
