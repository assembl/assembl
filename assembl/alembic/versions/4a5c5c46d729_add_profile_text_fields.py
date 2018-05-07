# -*- coding=utf-8 -*-
"""add_profile_text_fields

Revision ID: 4a5c5c46d729
Revises: 9dfb584793b1
Create Date: 2018-04-30 10:17:39.831003

"""

# revision identifiers, used by Alembic.
revision = '4a5c5c46d729'
down_revision = '9dfb584793b1'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    """Create text_field and profile_text_field tables,
    then add default text fields for each discussion."""
    from assembl import models as m
    from assembl.models.auth import TextFieldsTypesEnum, field_types
    db = m.get_session_maker()()
    with transaction.manager:
        op.create_table(
            'text_field',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('discussion_id',
                sa.Integer,
                sa.ForeignKey(
                    'discussion.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column('field_type',
                sa.Enum(*field_types, name='field_types'),
                nullable=False,
                default=TextFieldsTypesEnum.TEXT.value,
                server_default=TextFieldsTypesEnum.TEXT.value
            ),
            sa.Column('title_id', sa.Integer, sa.ForeignKey('langstring.id')),
            sa.Column('order', sa.Float, default=0.0, nullable=False),
            sa.Column('required', sa.Boolean),
            sa.schema.UniqueConstraint('title_id')
        )
        op.create_table(
            'profile_text_field',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column(
                'discussion_id',
                sa.Integer,
                sa.ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column(
                'text_field_id',
                sa.Integer,
                sa.ForeignKey('text_field.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column('agent_profile_id',
                sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
        )

        # insert default text fields
        with m.TextField.default_db.no_autoflush as db:
            discussions = db.query(m.Discussion.id).all()
            for discussion_id in discussions:
                title = m.LangString.create('Firstname', 'en')
                title.add_value(u'Prénom', 'fr')
                saobj = m.TextField(
                    discussion_id=discussion_id,
                    order=1.0,
                    title=title,
                    required=True
                )
                db.add(saobj)

                title = m.LangString.create('Lastname', 'en')
                title.add_value(u'Nom', 'fr')
                saobj = m.TextField(
                    discussion_id=discussion_id,
                    order=2.0,
                    title=title,
                    required=True
                )
                db.add(saobj)

                title = m.LangString.create('Nickname', 'en')
                title.add_value(u'Pseudo', 'fr')
                saobj = m.TextField(
                    discussion_id=discussion_id,
                    order=3.0,
                    title=title,
                    required=True
                )
                db.add(saobj)

                title = m.LangString.create('Email', 'en')
                title.add_value(u'Courriel', 'fr')
                saobj = m.TextField(
                    discussion_id=discussion_id,
                    field_type=TextFieldsTypesEnum.EMAIL.value,
                    order=4.0,
                    title=title,
                    required=True
                )
                db.add(saobj)

                title = m.LangString.create('Password', 'en')
                title.add_value(u'Mot de passe', 'fr')
                saobj = m.TextField(
                    discussion_id=discussion_id,
                    field_type=TextFieldsTypesEnum.PASSWORD.value,
                    order=5.0,
                    title=title,
                    required=True
                )
                db.add(saobj)

            db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('profile_text_field')
        op.drop_table('text_field')
