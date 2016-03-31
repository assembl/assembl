from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import literal_column, Integer
from sqlalchemy.orm import aliased
from sqlalchemy.sql.functions import func
from assembl.models import IdeaLink


def get_descendants(db, source_id):
    """Return a query that includes the descendants of an idea. (not idea itself yet.)

    Beware: we use a recursive query via a CTE and the PostgreSQL-specific
    ARRAY type. Blame this guy for that choice:
    http://explainextended.com/2009/09/24/adjacency-list-vs-nested-sets-postgresql/

    Also, that other guy provided insight into using CTE queries:
    http://stackoverflow.com/questions/11994092/how-can-i-perform-this-recursive-common-table-expression-in-sqlalchemy

    A literal column and an op complement nicely all this craziness.

    All I can say is SQLAlchemy kicks ass, and so does PostgreSQL.
    """
    level = literal_column('ARRAY[source_id]', type_=ARRAY(Integer))
    link = db.query(IdeaLink.source_id, IdeaLink.target_id) \
                  .add_columns(level.label('level')) \
                  .filter(IdeaLink.source_id == source_id) \
                  .cte(name='thread', recursive=True)
    source_alias = aliased(link, name='source')
    replies_alias = aliased(IdeaLink, name='replies')
    cumul_level = source_alias.c.level.op('||')(replies_alias.source_id)
    parent_link = replies_alias.source_id == source_alias.c.target_id
    children = db.query(replies_alias.source_id, replies_alias.target_id
                ).add_columns(cumul_level) \
                      .filter(parent_link)

    return db.query(link.union_all(children)).order_by(link.c.level)



def get_thread(self, levels=None):
    """Return a query that includes the post and its following thread.

    The `levels` argument limits how deep to search from the root. The root
    post itself is at level 1.

    The returned posts will be sorted by distance from the root.

    Beware: we use a recursive query via a CTE and the PostgreSQL-specific
    ARRAY type. Blame this guy for that choice:
    http://explainextended.com/2009/09/24/adjacency-list-vs-nested-sets-postgresql/

    Also, that other guy provided insight into using CTE queries:
    http://stackoverflow.com/questions/11994092/how-can-i-perform-this-recursive-common-table-expression-in-sqlalchemy

    A literal column and an op complement nicely all this craziness.

    All I can say is SQLAlchemy kicks ass, and so does PostgreSQL.

    """
    level = literal_column('ARRAY[id]', type_=ARRAY(Integer))
    post = self.db.query(self.__class__) \
                  .add_columns(level.label('level')) \
                  .filter(self.__class__.id == self.id) \
                  .cte(name='thread', recursive=True)
    post_alias = aliased(post, name='post')
    replies_alias = aliased(self.__class__, name='replies')
    cumul_level = post_alias.c.level.op('||')(replies_alias.id)
    parent_link = replies_alias.parent_id == post_alias.c.id
    children = self.db.query(replies_alias).add_columns(cumul_level) \
                      .filter(parent_link)

    if levels:
        level_limit = func.array_upper(post_alias.c.level, 1) < levels
        children = children.filter(level_limit)

    return self.db.query(post.union_all(children)).order_by(post.c.level)
