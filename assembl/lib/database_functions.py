"""Functions that we want to see defined in the database layer."""

from __future__ import absolute_import

from abc import abstractmethod

from .sqla import mark_changed


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


class PostgresFunctionManager(FunctionManager):
    def testFunctionExists(self, fname):
        (exists,) = self.session.execute(
            "select exists(select * from pg_proc where proname = '%s');" % (
                fname,)).first()
        return exists

    def functionList(self):
        return postgres_functions


def ensure_functions(session):
    manager = PostgresFunctionManager(session)
    manager.ensureFunctionsExist()
