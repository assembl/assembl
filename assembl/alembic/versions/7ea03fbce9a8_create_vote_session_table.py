from alembic import context, op
import sqlalchemy as sa

"""create vote_session table

Revision ID: 7ea03fbce9a8
Revises: c3f8bc9c75d5
Create Date: 2017-12-22 13:28:30.634303

"""

# revision identifiers, used by Alembic.
revision = '7ea03fbce9a8'
down_revision = 'c3f8bc9c75d5'


def LangStringId(column_name):
    return sa.Column(
        column_name + '_id',
        sa.Integer(),
        sa.ForeignKey('langstring.id')
    )


def lang_strings_args(lang_strings_names):
    args = [LangStringId(lang_string_name)
        for lang_string_name in lang_strings_names]
    
    lang_strings_id_names = [name + "_id"
        for name in lang_strings_names]
    
    args.append(sa.schema.UniqueConstraint(
        *lang_strings_id_names))
        
    return args
    
        

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'vote_session',
            sa.Column('id', sa.Integer, primary_key=True),
            *lang_strings_args([
                'instructions_section_title',
                'instructions_section_content',
                'propositions_section_title'])
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('vote_session')
