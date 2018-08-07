"""
All utility methods, classes and functions needed for testing applications
"""

import logging
import sys
from itertools import chain

import transaction
from sqlalchemy.sql.functions import count
from webtest import TestRequest
from webob.request import environ_from_url
from pyramid.threadlocal import manager
from contextlib import contextmanager

from assembl.lib.sqla import (
    configure_engine, get_session_maker,
    get_metadata, is_zopish, mark_changed)
from assembl.auth import R_PARTICIPANT


log = logging.getLogger('pytest.assembl')


class PyramidWebTestRequest(TestRequest):
    """
    A mock Pyramid web request this pushes itself onto the threadlocal stack
    that also contains the Assembl user_id according to authentication
    model
    This is very useful because throughout the model logic, a request is often
    required to determine the current_user, but outside of a Pyramid view. The
    way a request is injected is via the current_thread from threadlocal.
    """
    def __init__(self, *args, **kwargs):
        super(PyramidWebTestRequest, self).__init__(*args, **kwargs)
        manager.push({'request': self, 'registry': self._registry})
        self._base_pyramid_request = self._pyramid_app.request_factory(
            environ_from_url('/'))

    def get_response(self, app, catch_exc_info=True):
        try:
            super(PyramidWebTestRequest, app).get_response(
                catch_exc_info=catch_exc_info)
        finally:
            manager.pop()

    def route_path(self, name, *args, **kwargs):
        return self._base_pyramid_request.route_path(
            name, *args, **kwargs)

    def route_url(self, name, *args, **kwargs):
        return self._base_pyramid_request.route_url(
            name, *args, **kwargs)

    # TODO: Find a way to change user here
    authenticated_userid = None

    # How come this is missing in TestRequest?
    # TODO: Use the negotiator
    locale_name = 'en'


def committing_session_tween_factory(handler, registry):
    # This ensures that the app has the latest state
    def committing_session_tween(request):
        get_session_maker().commit()
        resp = handler(request)
        get_session_maker().flush()
        return resp

    return committing_session_tween


def as_boolean(s):
    if isinstance(s, bool):
        return s
    return str(s).lower() in ['true', '1', 'on', 'yes']


def get_all_tables(app_settings, session, reversed=True):
    schema = app_settings.get('db_schema', 'assembl_test')
    # TODO: Quote schema name!
    res = session.execute(
        "SELECT table_name FROM "
        "information_schema.tables WHERE table_schema = "
        "'%s' ORDER BY table_name" % (schema,)).fetchall()
    res = {row[0] for row in res}
    # get the ordered version to minimize cascade.
    # cascade does not exist on virtuoso.
    import assembl.models
    ordered = [t.name for t in get_metadata().sorted_tables
               if t.name in res]
    ordered.extend([t for t in res if t not in ordered])
    if reversed:
        ordered.reverse()
    log.debug('Current tables: %s' % str(ordered))
    return ordered


def self_referential_columns(table):
    return [fk.parent for fk in chain(*[
                c.foreign_keys for c in table.columns])
            if fk.column.table == table]


def clear_rows(app_settings, session):
    log.info('Clearing database rows.')
    tables_by_name = {
        t.name: t for t in get_metadata().sorted_tables}
    for table_name in get_all_tables(app_settings, session):
        log.debug("Clearing table: %s" % table_name)
        table = tables_by_name.get(table_name, None)
        if table is not None:
            cols = self_referential_columns(table)
            if len(cols):
                for col in cols:
                    session.execute("UPDATE %s SET %s=NULL" % (table_name, col.key))
                session.flush()
        session.execute("DELETE FROM \"%s\"" % table_name)
    session.commit()
    session.transaction.close()


def drop_tables(app_settings, session):
    log.info('Dropping all tables.')
    session.close()

    try:
        get_metadata().drop_all(session.connection())
        mark_changed()
    except Exception as e:
        raise Exception('Error dropping tables: %s' % e)


def base_fixture_dirname():
    from os.path import dirname
    return dirname(dirname(dirname(dirname(__file__)))) +\
        "/assembl/static/js/app/tests/fixtures/"


def api_call_to_fname(api_call, method="GET", **args):
    """Translate an API call to a filename containing most of the call information

    Used in :js:func:`ajaxMock`"""
    import os
    import os.path
    base_fixture_dir = base_fixture_dirname()
    api_dir, fname = api_call.rsplit("/", 1)
    api_dir = base_fixture_dir + api_dir
    if not os.path.isdir(api_dir):
        os.makedirs(api_dir)
    args = args.items()
    args.sort()
    args = "_".join(["%s_%s" % x for x in args])
    if args:
        fname += "_" + args
    if method != "GET":
        fname = method + "_" + fname
    fname += ".json"
    return os.path.join(api_dir, fname)


class RecordingApp(object):
    "Decorator for the test_app"
    def __init__(self, test_app):
        self.app = test_app

    def __getattribute__(self, name):
        if name not in {
                "get", "post", "post_json", "put", "put_json",
                "delete", "patch", "patch_json"}:
            return super(RecordingApp, self).__getattribute__(name)

        def appmethod(url, params=None, headers=None):
            r = getattr(self.app, name)(url, params, headers)
            assert 200 <= r.status_code < 300
            params = params or {}
            methodname = name.split("_")[0].upper()
            with open(api_call_to_fname(url, methodname, **params), "w") as f:
                f.write(r.body)
            return r
        return appmethod


def _create_role_for_user(user, discussion, session=None, role=R_PARTICIPANT):
    from assembl.models.auth import LocalUserRole, Role
    session = session or Role.default_db
    role = Role.get_role(role)
    local_role = LocalUserRole(user_id=user.id, discussion_id=discussion.id, role_id=role.id)
    session.add(local_role)
    session.flush()
    return local_role


def _delete_all_local_roles_for_user(user, discussion, session=None):
    from assembl.models import LocalUserRole
    session = session or LocalUserRole.default_db
    session.query(LocalUserRole).filter(
        LocalUserRole.discussion_id == discussion.id,
        LocalUserRole.user_id == user.id).delete()
    session.flush()


@contextmanager
def give_user_role(user, discussion, role=R_PARTICIPANT, session=None):
    """A usuable context manager to temporarily give a non-admin user a role within a discussion.
    All testing can be done in the context of this higher role-based user."""
    _create_role_for_user(user, discussion, session=session, role=role)
    yield
    _delete_all_local_roles_for_user(user, discussion, session=session)
