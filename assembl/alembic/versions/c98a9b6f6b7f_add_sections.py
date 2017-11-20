"""add_sections

Revision ID: c98a9b6f6b7f
Revises: 053f788ca313
Create Date: 2017-11-17 15:10:13.609004

"""

# revision identifiers, used by Alembic.
revision = 'c98a9b6f6b7f'
down_revision = '053f788ca313'

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
        section_types = [t.value for t in SectionTypesEnum.__members__.values()]
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
            sa.Column('order', sa.Float, default=0.0),
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
                homepage_section = m.Section(
                    discussion_id=discussion_id,
                    title=m.LangString.create(u'Home', 'en'),
                    url=u'',
                    section_type=SectionTypesEnum.HOMEPAGE.value,
                    order=0.0
                )
                db.add(homepage_section)
                debate_section = m.Section(
                    discussion_id=discussion_id,
                    title=m.LangString.create(u'Debate', 'en'),
                    url=u'',
                    section_type=SectionTypesEnum.DEBATE.value,
                    order=1.0
                )
                db.add(debate_section)
                syntheses_section = m.Section(
                    discussion_id=discussion_id,
                    title=m.LangString.create(u'Syntheses', 'en'),
                    url=u'',
                    section_type=SectionTypesEnum.SYNTHESES.value,
                    order=2.0
                )
                db.add(syntheses_section)
                resources_center_section = m.Section(
                    discussion_id=discussion_id,
                    title=m.LangString.create(u'Resources center', 'en'),
                    url=u'',
                    section_type=SectionTypesEnum.RESOURCES_CENTER.value,
                    order=3.0
                )
                db.add(resources_center_section)

                db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('section')
        sa.Enum(name='section_types').drop(op.get_bind(), checkfirst=False)
