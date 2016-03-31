"""sequence schema

Revision ID: df59c42297f
Revises: 525b7451056e
Create Date: 2016-03-31 06:16:39.665607

"""

# revision identifiers, used by Alembic.
revision = 'df59c42297f'
down_revision = '525b7451056e'

from alembic import context, op


from assembl.lib import config


# history_sequences = [
#     cls.id_sequence_name for cls in models.Base.get_subclasses()
#     if issubclass(cls, models.HistoryMixin) and (
#         cls.mro()[1] == models.HistoryMixin or
#         not issubclass(cls.mro()[1], models.HistoryMixin))]

history_sequences = [
    'idea_idea_link_idsequence',
    'idea_vote_idsequence',
    'idea_idsequence']


def upgrade(pyramid_env):
    full_schema = '.'.join((config.get('db_schema'), config.get('db_user')))
    with context.begin_transaction():
        for seqname in history_sequences:
            op.execute(
                "SELECT sequence_set('{1}.{0}', sequence_set('{0}', 0, 1), 0)"
                .format(seqname, full_schema))


def downgrade(pyramid_env):
    full_schema = '.'.join((config.get('db_schema'), config.get('db_user')))
    with context.begin_transaction():
        for seqname in history_sequences:
            op.execute(
                "SELECT sequence_set('{0}', sequence_set('{1}.{0}', 0, 1), 0)"
                .format(seqname, full_schema))
