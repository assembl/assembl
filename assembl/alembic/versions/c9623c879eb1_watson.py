"""watson

Revision ID: c9623c879eb1
Revises: 1937c27f98bf
Create Date: 2018-07-28 11:27:58.560993

"""

# revision identifiers, used by Alembic.
revision = 'c9623c879eb1'
down_revision = '1937c27f98bf'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'tag',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('locale_id', sa.Integer, sa.ForeignKey("locale.id")),
            sa.Column('label_id', sa.Integer, sa.ForeignKey("langstring.id")),
            sa.Column('base_tag_id', sa.Integer, sa.ForeignKey("tag.id")))

        op.create_table(
            "localized_concept",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("type", sa.String(20), nullable=False),
            sa.Column("concept_uri", sa.Unicode, index=True),
            sa.Column("locale_id", sa.Integer, sa.ForeignKey(
                "locale.id", ondelete="SET NULL")),
            sa.Column("english_id", sa.Integer, sa.ForeignKey(
                "localized_concept.id", ondelete="SET NULL")),
            sa.UniqueConstraint("concept_uri", "locale_id"),
        )

        op.create_table(
            "post_keyword_analysis",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("source_id", sa.Integer, sa.ForeignKey(
                "computation.id", ondelete="CASCADE")),
            sa.Column("tag_id", sa.Integer, sa.ForeignKey(
                "tag.id", ondelete="CASCADE")),
            sa.Column("post_id", sa.Integer, sa.ForeignKey(
                "content.id", ondelete="CASCADE")),
            sa.Column("score", sa.Float),
            sa.Column("category", sa.Boolean),
        )

        op.create_table(
            "post_dbpediaconcept_analysis",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("source_id", sa.Integer, sa.ForeignKey(
                "computation.id", ondelete="CASCADE")),
            sa.Column("keyword", sa.Unicode, index=True),
            sa.Column("post_id", sa.Integer, sa.ForeignKey(
                "content.id", ondelete="CASCADE")),
            sa.Column("score", sa.Float),
            sa.Column("concept_id", sa.Integer, sa.ForeignKey(
                "localized_concept.id", ondelete="CASCADE")),
        )

        op.create_table(
            "post_watsonv1_sentiments",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("post_id", sa.Integer, sa.ForeignKey(
                "content.id", ondelete="CASCADE")),
            sa.Column("source_id", sa.Integer, sa.ForeignKey(
                "computation.id", ondelete="CASCADE")),
            sa.Column("text_length", sa.Integer),
            sa.Column("sentiment", sa.Float),
            sa.Column("anger", sa.Float),
            sa.Column("disgust", sa.Float),
            sa.Column("fear", sa.Float),
            sa.Column("joy", sa.Float),
            sa.Column("sadness", sa.Float),
            sa.UniqueConstraint("source_id", "post_id"),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("post_keyword_analysis")
        op.drop_table("post_dbpediaconcept_analysis")
        op.drop_table("post_watsonv1_sentiments")
        op.drop_table("localized_concept")
        op.drop_table("tag")
