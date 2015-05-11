"""nonnull foreign keys

Revision ID: 4af80f6ad90a
Revises: 4ea8eee4b157
Create Date: 2015-05-10 21:41:09.394248

"""

# revision identifiers, used by Alembic.
revision = '4af80f6ad90a'
down_revision = '4ea8eee4b157'


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.scripts.rebuild_tables import rebuild_table
    # These tables had a nullable changed in d5204c294082bfa97284fcec273e3f53a464db51
    # except post was done in previous migration
    rebuild = [
        'partner_organization',
        'agent_status_in_discussion',
        'content_source',
        'discussion_permission',
        'anonymous_user',
        'content_source_ids',
        'imported_post',
        'local_user_role',
        'notification_subscription_on_extract',
        'notification_subscription_on_idea',
        'notification_subscription_on_post',
        'notification_subscription_on_useraccount',
        'sub_graph_idea_association',
        'sub_graph_idea_link_association',
        # 'text_fragment_identifier',
        'timeline_event',
        'user_language_preference',
        'user_role',
        'user_template',
        'username']

    tables = m.get_metadata().sorted_tables
    tables.reverse()
    for table in tables:
        if table.name in rebuild:
            rebuild_table(table, True)


def downgrade(pyramid_env):
    pass
