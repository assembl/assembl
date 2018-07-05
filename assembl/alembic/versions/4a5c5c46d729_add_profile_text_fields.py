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
from sqlalchemy.dialects.postgresql.json import JSONB
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    """Create text_field and profile_text_field tables,
    then add default text fields for each discussion."""
    from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum, TextFieldsTypesEnum, identifiers, field_types
    with context.begin_transaction():
        op.create_table(
            "configurable_field",
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'identifier',
                sa.Enum(*identifiers, name='configurable_field_identifiers'),
                nullable=False,
                default=ConfigurableFieldIdentifiersEnum.CUSTOM.value,
                server_default=ConfigurableFieldIdentifiersEnum.CUSTOM.value
            ),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column(
                'discussion_id',
                sa.Integer,
                sa.ForeignKey(
                    'discussion.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column('title_id', sa.Integer, sa.ForeignKey('langstring.id')),
            sa.Column('order', sa.Float, default=0.0, nullable=False),
            sa.Column('required', sa.Boolean),
            sa.schema.UniqueConstraint('title_id', name='uq_configurable_field_title_id')
        )

        op.create_table(
            'text_field',
            sa.Column(
                "id", sa.Integer,
                sa.ForeignKey("configurable_field.id"),
                primary_key=True),
            sa.Column(
                'field_type',
                sa.Enum(*field_types, name='text_field_types'),
                nullable=False,
                default=TextFieldsTypesEnum.TEXT.value,
                server_default=TextFieldsTypesEnum.TEXT.value
            ),
        )

        op.create_table(
            'profile_field',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column(
                'discussion_id',
                sa.Integer,
                sa.ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column(
                'configurable_field_id',
                sa.Integer,
                sa.ForeignKey('configurable_field.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column(
                'agent_profile_id',
                sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=False),
            sa.Column('value_data', JSONB),
        )

    from assembl import models as m
    db = m.get_session_maker()()

    # insert default text fields
    with transaction.manager:
        with m.TextField.default_db.no_autoflush as db:
            discussions = db.query(m.Discussion.id).all()
            for discussion_id in discussions:
                title = m.LangString.create('Fullname', 'en')
                title.add_value(u'Nom complet', 'fr')
                fullname_field = m.TextField(
                    discussion_id=discussion_id,
                    identifier=ConfigurableFieldIdentifiersEnum.FULLNAME.value,
                    order=1.0,
                    title=title,
                    required=True
                )
                db.add(fullname_field)

                title = m.LangString.create('Username', 'en')
                title.add_value(u"Nom d'utilisateur", 'fr')
                username_field = m.TextField(
                    discussion_id=discussion_id,
                    identifier=ConfigurableFieldIdentifiersEnum.USERNAME.value,
                    order=2.0,
                    title=title,
                    required=True
                )
                db.add(username_field)

                title = m.LangString.create('Email', 'en')
                title.add_value(u'Courriel', 'fr')
                email_field = m.TextField(
                    discussion_id=discussion_id,
                    field_type=TextFieldsTypesEnum.EMAIL.value,
                    identifier=ConfigurableFieldIdentifiersEnum.EMAIL.value,
                    order=3.0,
                    title=title,
                    required=True
                )
                db.add(email_field)

                title = m.LangString.create('Password', 'en')
                title.add_value(u'Mot de passe', 'fr')
                password_field = m.TextField(
                    discussion_id=discussion_id,
                    field_type=TextFieldsTypesEnum.PASSWORD.value,
                    identifier=ConfigurableFieldIdentifiersEnum.PASSWORD.value,
                    order=4.0,
                    title=title,
                    required=True
                )
                db.add(password_field)

                title = m.LangString.create('Password (confirm)', 'en')
                title.add_value(u'Confirmation de mot de passe', 'fr')
                password2_field = m.TextField(
                    discussion_id=discussion_id,
                    field_type=TextFieldsTypesEnum.PASSWORD.value,
                    identifier=ConfigurableFieldIdentifiersEnum.PASSWORD2.value,
                    order=5.0,
                    title=title,
                    required=True
                )
                db.add(password2_field)

        db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('profile_field')
        op.drop_table('text_field')
        op.drop_table('configurable_field')
        sa.Enum(name='text_field_types').drop(op.get_bind(), checkfirst=False)
        sa.Enum(name='configurable_field_identifiers').drop(op.get_bind(), checkfirst=False)
