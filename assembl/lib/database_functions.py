from __future__ import absolute_import

from abc import abstractmethod

from .config import get
from .sqla import mark_changed

virtuoso_functions = {
    "idea_content_links_above_post": """
CREATE PROCEDURE idea_content_links_above_post (IN root_id INTEGER)
{
    DECLARE agg VARCHAR;
    agg := '';
    FOR SELECT idea_content_link.id FROM idea_content_link
    WHERE idea_content_link.content_id IN (
        SELECT parent_id FROM (
            SELECT transitive t_in (1) t_out (2) T_DISTINCT
                parent_id, id FROM post
            UNION select id as parent_id, id from post) ip
            WHERE ip.parent_id IS NOT NULL AND ip.id=root_id) DO
    {
        agg := CONCAT(agg, CAST (id AS VARCHAR), ',');
    }

    RETURN agg;
}""",
}


class FunctionManager(object):

    def __init__(self, session):
        self.session = session

    @abstractmethod
    def testFunctionExists(self, fname):
        return False

    @classmethod
    def functionList(self):
        return {}

    def ensureFunctionsExist(self):
        for fname, fdef in self.functionList().iteritems():
            if not self.testFunctionExists(fname):
                self.session.execute(fdef)
                mark_changed()


class VirtuosoFunctionManager(FunctionManager):
    def testFunctionExists(self, fname):
        ((count,),) = list(self.session.execute(
            "SELECT count(p_name) FROM db.dba.sys_procedures WHERE p_name='%s'" % (
                '.'.join((get("db_schema"), get("db_user"), fname)),)))
        return bool(count)

    def functionList(self):
        return virtuoso_functions


def ensure_functions(session):
    manager = None
    if get('sqlalchemy.url').startswith('virtuoso:'):
        manager = VirtuosoFunctionManager(session)
    if manager:
        manager.ensureFunctionsExist()
