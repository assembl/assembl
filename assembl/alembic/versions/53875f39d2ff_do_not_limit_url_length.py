"""Do not limit URL length

Revision ID: 53875f39d2ff
Revises: e2b03a727fd
Create Date: 2015-11-11 15:45:09.655581

"""

# revision identifiers, used by Alembic.
revision = '53875f39d2ff'
down_revision = 'e2b03a727fd'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config

url_columns = [
    ("partner_organization", "logo", True),
    ("partner_organization", "homepage", True),
    ("idprovider_agent_account", "picture_url", True),
    ("feed_posts_source", "url", False),
    ("weblink_user", "user_link", True),
    ("edgesense_drupal_source", "node_source", False),
    ("edgesense_drupal_source", "user_source", False),
    ("edgesense_drupal_source", "comment_source", False),
    ("source_specific_account", "user_link", True),
    ("facebook_source", "url_path", True),
]


def upgrade(pyramid_env):
    # 4082 is the virtuoso maximum for VARCHAR. It refuses to modify to VARCHAR
    schema, user = config.get('db_schema'), config.get('db_user')
    with context.begin_transaction():
        for table, column, nullable in url_columns:
            op.execute(
                "alter table %s.%s.%s modify column %s varchar(4082) %s" % (
                    schema, user, table, column,
                    "" if nullable else " NOT NULL"))


def downgrade(pyramid_env):
    pass
