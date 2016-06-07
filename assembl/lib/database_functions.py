"""Functions that we want to see defined in the database layer."""

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

postgres_functions = {
    "idea_content_links_above_post": """
CREATE OR REPLACE FUNCTION idea_content_links_above_post(IN root_id integer)
        RETURNS varchar AS $$
DECLARE
    posts varchar;
    posts_a integer[];
    icl_a integer[];
    agg varchar;
BEGIN
    SELECT post.ancestry || cast (post.id as VARCHAR) FROM post
        WHERE post.id = root_id INTO posts;
    IF posts IS NULL THEN
        RETURN '';
    END IF;
    SELECT string_to_array(posts, ',') INTO posts_a;
    SELECT array (
        SELECT idea_content_link.id FROM unnest(posts_a) post_id
        JOIN idea_content_link ON content_id = cast (post_id AS INTEGER)
    ) INTO icl_a;
    agg := array_to_string(icl_a, ',');
    RETURN agg;
END;
$$ LANGUAGE plpgsql;"""
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
        (count,) = self.session.execute(
            "SELECT count(p_name) FROM db.dba.sys_procedures WHERE p_name='%s'" % (
                '.'.join((get("db_schema"), get("db_user"), fname)),)).first()
        return bool(count)

    def functionList(self):
        return virtuoso_functions


class PostgresFunctionManager(FunctionManager):
    def testFunctionExists(self, fname):
        (exists,) = self.session.execute(
            "select exists(select * from pg_proc where proname = '%s');" % (
                fname,)).first()
        return exists

    def functionList(self):
        return postgres_functions


def ensure_functions(session):
    manager = None
    url = get('sqlalchemy.url')
    if url.startswith('virtuoso:'):
        manager = VirtuosoFunctionManager(session)
    elif url.startswith('postgresql'):
        manager = PostgresFunctionManager(session)
    if manager:
        manager.ensureFunctionsExist()
