"""Maildir support

Revision ID: 3ebd3f1deebe
Revises: 28f4b541f727
Create Date: 2014-04-23 14:34:04.677810

"""

# revision identifiers, used by Alembic.
revision = '3ebd3f1deebe'
down_revision = '28f4b541f727'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'source_imapmailbox',
            sa.Column('id',
                      sa.Integer,
                      sa.ForeignKey(
                                    'mailbox.id',
                                    ondelete='CASCADE',
                                    onupdate='CASCADE'
                                    ),
                      primary_key=True),
            sa.Column('host', sa.String(1024), nullable=False),
            sa.Column('port', sa.Integer, nullable=False),
            sa.Column('username', sa.UnicodeText, nullable=False),
            sa.Column('use_ssl', sa.Boolean, default=True),
            sa.Column('password', sa.UnicodeText, nullable=False),
            )
        op.drop_constraint('source_mailinglist_mailbox_id_id', 'source_mailinglist')

        op.execute(
            "INSERT INTO source_imapmailbox (id, host, port, username, use_ssl, \"password\") "
            "SELECT id, host, port, username, use_ssl, \"password\" "
            "FROM mailbox"
            )
        op.drop_column('mailbox', 'host')
        op.drop_column('mailbox', 'port')
        op.drop_column('mailbox', 'username')
        op.drop_column('mailbox', 'use_ssl')
        op.drop_column('mailbox', 'password')
        
        op.create_foreign_key('source_mailinglist_source_imapmailbox_id_id',
            "source_mailinglist", "source_imapmailbox",
            ["id"], ["id"])

        op.create_table(
            'source_filesystemmailbox',
            sa.Column('id',
                      sa.Integer,
                      sa.ForeignKey(
                                    'mailbox.id',
                                    ondelete='CASCADE',
                                    onupdate='CASCADE'
                                    ),
                      primary_key=True),
            sa.Column('filesystem_path', sa.Unicode(), nullable=False)
            )

        op.create_table(
            'source_maildirmailbox',
            sa.Column('id',
                      sa.Integer,
                      sa.ForeignKey(
                                    'source_filesystemmailbox.id',
                                    ondelete='CASCADE',
                                    onupdate='CASCADE'
                                    ),
                      primary_key=True),
            )

def downgrade(pyramid_env):
    with context.begin_transaction():
        fail
