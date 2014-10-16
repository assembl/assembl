"""metadata on IdeaProposalPost

Revision ID: 287e89a8677a
Revises: 2ab6e44b72d3
Create Date: 2014-10-16 10:37:31.148270

"""

# revision identifiers, used by Alembic.
revision = '287e89a8677a'
down_revision = '2ab6e44b72d3'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("INSERT INTO post_with_metadata (id) SELECT id from idea_proposal_post")
        op.drop_constraint("idea_proposal_post_assembl_post_id_id", "idea_proposal_post")
        op.execute("""ALTER TABLE idea_proposal_post
          ADD CONSTRAINT "idea_proposal_post_post_with_metadata_id_id" FOREIGN KEY ("id")
            REFERENCES post_with_metadata ("id") ON UPDATE CASCADE ON DELETE CASCADE""")

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("DELETE FROM post_with_metadata WHERE id IN (SELECT id from idea_proposal_post)")
        op.drop_constraint("idea_proposal_post_post_with_metadata_id_id", "idea_proposal_post")
        op.execute("""ALTER TABLE idea_proposal_post
          ADD CONSTRAINT "idea_proposal_post_assembl_post_id_id" FOREIGN KEY ("id")
            REFERENCES assembl_post ("id") ON UPDATE CASCADE ON DELETE CASCADE""")
