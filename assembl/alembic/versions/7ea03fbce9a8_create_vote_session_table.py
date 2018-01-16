"""create vote_session table

Revision ID: 7ea03fbce9a8
Revises: c14c885ecdc2
Create Date: 2017-12-22 13:28:30.634303

"""
from alembic import context, op
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.schema import UniqueConstraint
import transaction


# revision identifiers, used by Alembic.
revision = '7ea03fbce9a8'
down_revision = 'c14c885ecdc2'


def LangStringId(column_name):
    return Column(
        column_name + '_id',
        Integer(),
        ForeignKey('langstring.id')
    )


def lang_strings_args(lang_strings_names):
    args = [LangStringId(lang_string_name)
        for lang_string_name in lang_strings_names]

    lang_strings_id_names = [name + "_id" for name in lang_strings_names]

    args.append(UniqueConstraint(*lang_strings_id_names))

    return args


def ForeignIdColumn(foreign_column_name, fk_kwargs = {}, **kwargs):
    return Column(foreign_column_name + '_id',
        Integer(),
        ForeignKey(foreign_column_name + '.id', **fk_kwargs),
        **kwargs
    )


def IdColumn():
    return Column('id', Integer(), primary_key = True)


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'vote_session',
            IdColumn(),
            ForeignIdColumn('discussion_phase',
                nullable = False,
                unique = True,
            ),
            *lang_strings_args([
                "title",
                "sub_title",
                "instructions_section_title",
                "instructions_section_content",
                "propositions_section_title"
            ])
        )
        op.create_table(
            'vote_session_attachment',
            Column(
                'id',
                Integer,
                ForeignKey(
                    'attachment.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                primary_key=True
            ),
            Column(
                'vote_session_id',
                Integer,
                ForeignKey(
                    'vote_session.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=True
            ),
        )



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('vote_session_attachment')
        op.drop_table('vote_session')
