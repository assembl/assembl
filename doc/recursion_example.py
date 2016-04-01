from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import literal_column, Integer, select, text, bindparam
from sqlalchemy.orm import aliased
from sqlalchemy.sql.functions import func
from assembl.models import IdeaLink
from sqlalchemy.sql.expression import literal_column, column


def get_descendants_select(source_id):
    """Return a query that includes the descendants of an idea. (not idea itself yet.)

    Beware: we use a recursive query via a CTE and the PostgreSQL-specific
    ARRAY type. Blame this guy for that choice:
    http://explainextended.com/2009/09/24/adjacency-list-vs-nested-sets-postgresql/

    Also, that other guy provided insight into using CTE queries:
    http://stackoverflow.com/questions/11994092/how-can-i-perform-this-recursive-common-table-expression-in-sqlalchemy

    A literal column and an op complement nicely all this craziness.

    All I can say is SQLAlchemy kicks ass, and so does PostgreSQL.
    """
    link = select(
            [IdeaLink.source_id, IdeaLink.target_id]
        ).select_from(
            IdeaLink
        ).where(
            IdeaLink.source_id == source_id
        ).cte(recursive=True)
    source_alias = aliased(link)
    targets_alias = aliased(IdeaLink)
    parent_link = targets_alias.source_id == source_alias.c.target_id
    children = select(
            [targets_alias.source_id, targets_alias.target_id]
        ).select_from(targets_alias).where(parent_link)
    with_children = link.union_all(children)
    return with_children



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
