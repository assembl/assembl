# -*- coding=utf-8 -*-
"""add_sections

Revision ID: c98a9b6f6b7f
Revises: ca1c445a2e24
Create Date: 2017-11-17 15:10:13.609004

"""

# revision identifiers, used by Alembic.
revision = 'c98a9b6f6b7f'
down_revision = '91771ba48539'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla_types import URLString


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.models.section import SectionTypesEnum

    db = m.get_session_maker()()
    with transaction.manager:
        section_types = [
            t.value for t in SectionTypesEnum.__members__.values()]
        op.create_table(
            'section',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('discussion_id',
                      sa.Integer,
                      sa.ForeignKey(
                          'discussion.id',
                          ondelete="CASCADE",
                          onupdate="CASCADE"), nullable=False, index=False),
            sa.Column('title_id', sa.Integer, sa.ForeignKey('langstring.id')),
            sa.Column('url', URLString(1024)),
            sa.Column('order', sa.Float, default=0.0, nullable=False),
            sa.Column(
                'section_type',
                sa.Enum(*section_types, name='section_types'),
                nullable=False,
                default=SectionTypesEnum.CUSTOM.value,
                server_default=SectionTypesEnum.CUSTOM.value),
            sa.schema.UniqueConstraint('title_id')
        )

        # insert default sections
        with m.Section.default_db.no_autoflush as db:
            discussions = db.query(m.Discussion.id).all()
            for discussion_id in discussions:
                langstring = m.LangString.create(u'Home', 'en')
                langstring.add_value(u'Accueil', 'fr')
                homepage_section = m.Section(
                    discussion_id=discussion_id,
                    title=langstring,
                    section_type=SectionTypesEnum.HOMEPAGE.value,
                    order=0.0
                )
                db.add(homepage_section)

                langstring = m.LangString.create(u'Debate', 'en')
                langstring.add_value(u'Débat', 'fr')
                debate_section = m.Section(
                    discussion_id=discussion_id,
                    title=langstring,
                    section_type=SectionTypesEnum.DEBATE.value,
                    order=1.0
                )
                db.add(debate_section)

                langstring = m.LangString.create(u'Syntheses', 'en')
                langstring.add_value(u'Synthèses', 'fr')
                syntheses_section = m.Section(
                    discussion_id=discussion_id,
                    title=langstring,
                    section_type=SectionTypesEnum.SYNTHESES.value,
                    order=2.0
                )
                db.add(syntheses_section)

                langstring = m.LangString.create(u'Resources center', 'en')
                langstring.add_value(u'Ressources', 'fr')
                resources_center_section = m.Section(
                    discussion_id=discussion_id,
                    title=langstring,
                    section_type=SectionTypesEnum.RESOURCES_CENTER.value,
                    order=3.0
                )
                db.add(resources_center_section)

                langstring = m.LangString.create(u'Administration', 'en')
                langstring.add_value(u'Administration', 'fr')
                administration_section = m.Section(
                    discussion_id=discussion_id,
                    title=langstring,
                    section_type=SectionTypesEnum.ADMINISTRATION.value,
                    order=99.0
                )
                db.add(administration_section)

                db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('section')
        sa.Enum(name='section_types').drop(op.get_bind(), checkfirst=False)
