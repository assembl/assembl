"""idea widget link

Revision ID: 2df4150af427
Revises: 51e90ff6a48c
Create Date: 2014-06-07 15:58:50.240085

"""

# revision identifiers, used by Alembic.
revision = '2df4150af427'
down_revision = '51e90ff6a48c'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'idea_widget_link',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60)),
            sa.Column('idea_id', sa.Integer, sa.ForeignKey(
                'idea.id'), nullable=False, index=True),
            sa.Column('widget_id', sa.Integer, sa.ForeignKey(
                'widget.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False, index=True))
        op.execute("""INSERT INTO idea_widget_link (type, idea_id, widget_id)
            SELECT 'voteable_idea_widget_link', idea.id, widget_id FROM idea
            JOIN widget ON (widget_id = widget.id)
            WHERE widget.type = 'voting_widget'""")
        op.execute("""INSERT INTO idea_widget_link (type, idea_id, widget_id)
            SELECT 'generated_idea_widget_link',
                sub_graph_idea_association.idea_id, widget.id
            FROM widget
            JOIN idea_view_widget USING (id)
            JOIN explicit_sub_graph_view
                ON (main_idea_view_id = explicit_sub_graph_view.id)
            JOIN sub_graph_idea_association
                ON (main_idea_view_id =
                    sub_graph_idea_association.sub_graph_id)
            WHERE widget.type = 'creativity_widget'""")

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    class ObsoleteIdeaViewWidget(m.Widget):
        __tablename__ = 'idea_view_widget'

        __mapper_args__ = {
            'polymorphic_identity': 'idea_view_widget',
        }
        id = sa.Column(sa.Integer, sa.ForeignKey(
            'widget.id', ondelete='CASCADE', onupdate='CASCADE'),
            primary_key=True)

        main_idea_view_id = sa.Column(sa.Integer, sa.ForeignKey(
            'idea_graph_view.id', ondelete="CASCADE",
            onupdate="CASCADE"),
            nullable=True)
        main_idea_view = sa.orm.relationship("IdeaGraphView")


    class ObsoleteCreativityWidget(ObsoleteIdeaViewWidget):
        default_view = 'creativity_widget'
        __mapper_args__ = {
            'polymorphic_identity': 'creativity_widget',
        }


    with transaction.manager:
        for w in db.query(m.Widget).all():
            idea_id = w.settings_json.get('idea', None)
            if not idea_id:
                continue
            idea_id = m.Idea.get_database_id(idea_id)
            l = db.query(m.GeneratedIdeaWidgetLink).filter_by(
                idea_id=idea_id, widget_id=w.id).first()
            if l:
                l.type = 'base_idea_widget_link'
            else:
                db.add(m.BaseIdeaWidgetLink(
                    idea_id=idea_id,
                    widget_id=w.id))
        db.flush()
        for w in db.query(ObsoleteIdeaViewWidget).all():
            view = w.main_idea_view
            for ia in view.idea_assocs:
                db.delete(ia)
            for ila in view.idealink_assocs:
                db.delete(ila)
            w.type = 'creativity_session_widget'
            db.flush()
            db.execute('delete from idea_view_widget where id='+str(w.id))
            db.delete(view)

    with context.begin_transaction():
        op.drop_column('idea', 'widget_id')
        op.drop_table('idea_view_widget')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'idea',
            sa.Column('widget_id', sa.Integer,
                      sa.ForeignKey('widget.id')))
        op.create_table(
            'idea_view_widget',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'widget.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'main_idea_view_id', sa.Integer, sa.ForeignKey(
                    'idea_graph_view.id', ondelete="CASCADE",
                    onupdate="CASCADE"),
                nullable=True))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        m.Idea.widget_id = sa.Column(
            'widget_id', sa.Integer, sa.ForeignKey('widget.id'))
        for w in db.query(m.CreativityWidget).all():
            view = m.ExplicitSubGraphView(discussion_id=w.discussion_id)
            db.add(view)
            w.type = "creativity_widget"
            db.flush()
            db.execute("INSERT INTO idea_view_widget (id, main_idea_view_id)"
                       " VALUES (%d, %d)" % (w.id, view.id))
            for il in w.idea_links:
                db.add(m.SubGraphIdeaAssociation(
                    sub_graph=view, idea=il.idea))
                if isinstance(il, m.BaseIdeaWidgetLink):
                    il.idea.widget_id = w.id

    with context.begin_transaction():
        op.drop_table('idea_widget_link')
