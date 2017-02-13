"""duplicate SubGraphIdeaAssociation

Revision ID: 498e7af689d2
Revises: d4901e335082
Create Date: 2017-02-13 10:36:44.157978

"""

# revision identifiers, used by Alembic.
revision = '498e7af689d2'
down_revision = 'd4901e335082'

from itertools import chain

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        dups = list(db.execute(
            """SELECT array_agg(id) FROM sub_graph_idea_association
                GROUP BY idea_id, sub_graph_id HAVING count(id) > 1"""))
        if dups:
            extras = list(chain(*[l[1:] for l in dups]))
            db.execute(
                'DELETE FROM sub_graph_idea_association WHERE id IN (%s)' % (
                    ','.join(extras)))
        dups = list(db.execute(
            """SELECT array_agg(id) FROM sub_graph_idea_link_association
                GROUP BY idea_link_id, sub_graph_id HAVING count(id) > 1"""))
        if dups:
            extras = list(chain(*[l[1:] for l in dups]))
            db.execute(
                'DELETE FROM sub_graph_idea_link_association WHERE id IN (%s)' % (
                    ','.join(extras)))

    with context.begin_transaction():
        op.create_unique_constraint(
            "%s_%s_sub_graph_idea_association_UNQC_idea_id_sub_graph_id" % (
                config.get('db_schema'), config.get('db_user')),
            "sub_graph_idea_association", ["idea_id", "sub_graph_id"])
        op.create_unique_constraint(
            "%s_%s_sub_graph_idea_link_association_UNQC_idea_link_id_sub_graph_id" % (
                config.get('db_schema'), config.get('db_user')),
            "sub_graph_idea_link_association", ["idea_link_id", "sub_graph_id"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_sub_graph_idea_association_UNQC_idea_id_sub_graph_id" % (
                config.get('db_schema'), config.get('db_user')),
            "sub_graph_idea_association")
        op.drop_constraint(
            "%s_%s_sub_graph_idea_link_association_UNQC_idea_link_id_sub_graph_id" % (
                config.get('db_schema'), config.get('db_user')),
            "sub_graph_idea_link_association")
