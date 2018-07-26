"""add_extract_lang

Revision ID: 134299d407b9
Revises: 074316d2e8a8
Create Date: 2018-08-02 10:44:11.357095

"""

# revision identifiers, used by Alembic.
revision = '134299d407b9'
down_revision = '074316d2e8a8'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'extract',
            sa.Column(
                'locale_id', sa.Integer,
                sa.ForeignKey('locale.id')))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        model = m.Extract
        query = db.query(model)
        for extract in query:
            post = extract.get_post()
            if post:
                entry = post.body.first_original()
                if entry:
                    extract.lang = entry.locale_code


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'locale_id')
