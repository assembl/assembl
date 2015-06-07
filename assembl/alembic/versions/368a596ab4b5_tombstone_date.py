"""tombstone date

Revision ID: 368a596ab4b5
Revises: 92cf7ae9633
Create Date: 2015-05-30 15:20:37.165788

"""

# revision identifiers, used by Alembic.
revision = '368a596ab4b5'
down_revision = '92cf7ae9633'

import datetime
from collections import defaultdict

from alembic import context, op
import sqlalchemy as sa
import transaction
import sqlalchemy.sql.functions as sqlfunc
from sqlalchemy.exc import ProgrammingError, DataError

from assembl.lib import config
from assembl.lib.sqla import mark_changed


tables = ('idea', 'idea_idea_link', 'idea_vote')

maybe_intemporal = [
('idea_content_link', 'idea_id', 'idea'),
('notification_subscription_on_idea', 'idea_id', 'idea'),
('idea_proposal_post', 'idea_id', 'idea'),
('idea_vote', 'criterion_id', 'idea'),
('idea_vote', 'idea_id', 'idea'),
('idea_widget_link', 'idea_id', 'idea'),

# Explicitly excluded: Those must be able to point to tombstones.
# ('idea_idea_link', 'source_id', 'idea'),
# ('idea_idea_link', 'target_id', 'idea'),
# ('sub_graph_idea_association', 'idea_id', 'idea'),
# ('sub_graph_idea_link_association', 'idea_link_id', 'idea_idea_link'),
]


ID_TABLE = '_idtable'

def reconstruct_idea_history(db):
    from assembl.models import (
        Idea, IdeaLink, Discussion, SynthesisPost, Synthesis,
        SubGraphIdeaLinkAssociation)
    start_by_discussion = dict(db.query(Discussion.id, sqlfunc.min(Idea.creation_date)).join(Idea).filter(Idea.sqla_type != 'assembl:RootIdea').all())
    ideas=db.query(Idea).all()
    idea_links=db.query(IdeaLink).all()
    synthesis_dates = dict(db.query(IdeaLink.id, SynthesisPost.creation_date).join(SubGraphIdeaLinkAssociation).join(Synthesis).join(SynthesisPost).all())
    link_by_id = {l.id: l for l in idea_links}
    link_ids = link_by_id.keys()
    link_ids.sort()
    end = datetime.datetime.now()
    min_creation = {
        l.id: max(l.source_ts.creation_date, l.target_ts.creation_date) for l in idea_links
    }
    max_end = {id:end for id in link_ids}

    for id, date in synthesis_dates.iteritems():
        min_creation[id] = date
        max_end[id] = date
        link_by_id[id].tombstone_date = date

    # monotonicity of start
    last_date = min_creation[link_ids[0]]
    for id in link_ids:
        last_date = max(last_date, min_creation[id])
        min_creation[id] = last_date
        # arbitrary increment
        if last_date < max_end[id]:
            last_date = min(last_date+datetime.timedelta(seconds=10),
                            max_end[id])

    # child is target. So no two links with same target can coexist.
    by_target = defaultdict(list)
    ends_before = {}
    for l in idea_links:
        by_target[l.target_id].append(l.id)

    live_ids = {}
    # if same target, one replaces the other.
    for l in by_target.itervalues():
        l.sort()
        live_id=[id for id in l if not link_by_id[id].is_tombstone]
        assert len(live_id) < 2
        if len(live_id):
            live_id = live_id[0] if live_id else l[-1]
            non_synth = [id for id in l if id not in synthesis_dates]
            if not non_synth[-1] == live_id:
                import pdb; pdb.set_trace()
        else:
            live_id = l[-1]
        live_ids.update({id:live_id for id in l})
        last_id = None
        for id in l:
            link = link_by_id[id]
            link.base_id = live_id
            if last_id:
                ends_before[last_id] = id
            if id in synthesis_dates:
                continue
            last_id = id
            max_end[last_id] = min(min_creation[id], max_end[last_id])
        assert last_id == live_id

    for link in idea_links:
        if link.is_tombstone:
            link.tombstone_date = max_end[link.id]

    # for id in link_ids:
    #     print id, min_creation[id] != max_end[id]

    # for id,date in max_end.iteritems():
    #     print id, id in synthesis_dates, date if link_by_id[id].is_tombstone else None

    dead_ideas=[idea for idea in ideas if idea.is_tombstone]
    for idea in dead_ideas:
        links = db.query(IdeaLink.id).filter((IdeaLink.source_id == idea.id) | (IdeaLink.target_id == idea.id)).all()
        idea.tombstone_date = max((max_end[id] for (id,) in links))

def vote_key(vote):
    return (vote.idea_id, vote.criterion_id, vote.voter_id)

def reconstruct_vote_history(db):
    from assembl.models import AbstractIdeaVote
    votes = db.query(AbstractIdeaVote).all()
    by_key = defaultdict(list)
    for vote in votes:
        by_key[vote_key(vote)].append(vote)
    for similar_votes in by_key.itervalues():
        similar_votes.sort(key=lambda v: v.id)
        previous = None
        assert not similar_votes[-1].is_tombstone
        assert all([vote.is_tombstone for vote in similar_votes[:-1]])
        live_vote_id = similar_votes[-1].id
        for vote in similar_votes:
            vote.base_id = live_vote_id
            if previous is not None and previous.is_tombstone:
                previous.tombstone_date = vote.vote_date
            previous = vote


def delete_boolean_constraint(db, table, column):
    # The CHECK constraints are generally unnamed. 
    # Dropping the column does not delete the constraint. WHY????
    username = config.get('db_user')
    schema = config.get('db_schema')
    constraints = list(db.execute("select c_text, c_mode from db.dba.sys_constraints where c_table = '%s.%s.%s'" % (
        schema, username, table)))
    for constraint_name, constraint_code in constraints:
        # column name substring would be annoying...
        if column in constraint_code:
            db.execute('alter table "%s"."%s"."%s" drop constraint "%s"' % (
                schema, username, table, constraint_name))

def upgrade(pyramid_env):
    schema, user = config.get('db_schema'), config.get('db_user')
    # to enable delete_boolean_constraint
    admin_engine = sa.create_engine('virtuoso://dba:dba@VOSU')
    admin_engine.execute('GRANT SELECT ON DB.DBA.SYS_CONSTRAINTS TO ' + user)
    with context.begin_transaction():
        for tablename in tables:
            idtable_name = tablename+ID_TABLE
            op.create_table(idtable_name, sa.Column(
                'id', sa.Integer, primary_key=True))
            op.add_column(tablename, sa.Column(
                'base_id', sa.Integer, nullable=False))
            op.add_column(tablename, sa.Column(
                'tombstone_date', sa.DateTime))

    # Basic defaults
    with transaction.manager:
        for tablename in tables:
            idtable_name = tablename+ID_TABLE
            op.execute('INSERT INTO %s (id) SELECT id FROM %s' % (idtable_name, tablename))
            try:
                op.execute("select sequence_set('{table}_idsequence',"
                    "(select 1+max(id) from {table}), 0)".format(table=tablename))
            except DataError:
                pass  # empty tables
            op.execute('UPDATE %s SET "base_id" = "id"' % (tablename,))
            op.execute('UPDATE %s SET "tombstone_date" = now() WHERE "is_tombstone" = 1' % (tablename,))
        mark_changed()

    # Do stuff with the app's models here.
    
    with transaction.manager:
        from assembl.models import get_session_maker
        db = get_session_maker()()
        reconstruct_vote_history(db)
        reconstruct_idea_history(db)
        for tablename in tables:
            delete_boolean_constraint(db, tablename, 'is_tombstone')

    with context.begin_transaction():
        # I thought of redirecting foreign keys, but much pain, insignificant gain. Punt it. 
        # for source, sid, dest in maybe_intemporal:
        #     op.drop_constraint(source,
        #         '{source}_{dest}_idtable_{sid}_id'.format(source=source, sid=sid, dest=dest))
        #     op.create_foreign_key(
        #         '{source}_{dest}_idtable_{sid}_id'.format(source=source, sid=sid, dest=dest),
        #         source, dest+ID_TABLE, [sid], ['id'])
        #     WOULDBE_TODO: also drop and create respective indexes
        for tablename in tables:
            idtable_name = tablename+ID_TABLE
            op.create_foreign_key(
                '{table}_{table}_idtable_base_id_id'.format(table=tablename),
                tablename, idtable_name, ['base_id'], ['id'])
            index_name = "%s_%s_%s_UNQC_base_id_tombstone_date" % (
                schema, user, tablename)
            op.create_unique_constraint(
                index_name, tablename, ['base_id', 'tombstone_date'], schema=schema)
            try:
                op.drop_index('ix_%s_%s_is_tombstone'%(schema, tablename), tablename)
            except ProgrammingError:
                pass  # This index should not even be there.
            op.drop_column(tablename, 'is_tombstone')

def downgrade(pyramid_env):
    schema, user = config.get('db_schema'), config.get('db_user')
    with context.begin_transaction():
        for tablename in tables:
            index_name = "%s_%s_%s_UNQC_base_id_tombstone_date" % (
                schema, user, tablename)
            op.drop_constraint(index_name, tablename, schema=schema)
            op.add_column(tablename, sa.Column('is_tombstone', sa.SmallInteger, server_default="0"))

    # repopulate is_tombstone
    with transaction.manager:
        for tablename in tables:
            op.execute('UPDATE %s set "is_tombstone" = (CASE WHEN "tombstone_date" IS NULL THEN 0 ELSE 1 END)' % (tablename,))
        mark_changed()

    with context.begin_transaction():
        for tablename in tables:
            op.drop_column(tablename, "base_id")
            op.drop_column(tablename, "tombstone_date")
            op.drop_table(tablename+ID_TABLE)
            op.execute('ALTER TABLE %s ADD CHECK ("is_tombstone" IN (0, 1))'%(tablename,))
