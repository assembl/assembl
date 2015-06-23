"""snapshot old syntheses

Revision ID: 4e6b939229c3
Revises: 5a410de37088
Create Date: 2015-06-23 10:11:15.798197

"""

# revision identifiers, used by Alembic.
revision = '4e6b939229c3'
down_revision = '5a410de37088'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        synths = db.query(m.Synthesis).join(
            m.SubGraphIdeaAssociation, m.Idea, m.SynthesisPost).filter(
            (m.SynthesisPost.id != None) & (m.Idea.tombstone_date == None)).all()
        # reuse idea snapshots in this one case
        for synth in synths:
            snapshots = {}
            for assoc in synth.idea_assocs:
                idea = assoc.idea
                assoc.idea = idea.copy(True)
                snapshots[idea.id] = assoc.idea
                assoc.idea.tombstone_date = synth.creation_date
            # AND change the links. Sigh.
            synth.db.flush()
            snapshots = {id: idea.id for (id, idea) in snapshots.iteritems()}
            for link in synth.idea_links:
                assert link.is_tombstone
                id = link.source_id
                link.source_id = snapshots.get(id, id)
                id = link.target_id
                link.target_id = snapshots.get(id, id)


def downgrade(pyramid_env):
    pass
