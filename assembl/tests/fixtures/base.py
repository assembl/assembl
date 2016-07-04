"""
The core fixtures that will:
    1) create the test database
    2) create the tables
    3) create the schema, based on the models
    4) drop the tables (upon completion)
    5) create a pyramid test application
    6) create a databse session
    7) A fixture for a headless browser (phantomjs)
"""

import pytest
import transaction
from webtest import TestApp
from pkg_resources import get_distribution
from pyramid.threadlocal import manager
from pyramid import testing
from pytest_localserver.http import WSGIServer
from splinter import Browser

import assembl
from assembl.lib.config import get_config
from assembl.lib.migration import bootstrap_db, bootstrap_db_data
from assembl.lib.sqla import get_session_maker
from assembl.tasks import configure as configure_tasks
from assembl.auth import R_SYSADMIN
from ..utils import PyramidWebTestRequest
from ..utils import clear_rows, drop_tables


@pytest.fixture(scope="session")
def session_factory(request):
    """An SQLAlchemy Session Maker fixture"""

    # Get the zopeless session maker,
    # while the Webtest server will use the
    # default session maker, which is zopish.
    session_factory = get_session_maker()

    def fin():
        print "finalizer session_factory"
        session_factory.remove()
    request.addfinalizer(fin)
    return session_factory


@pytest.fixture(scope="session")
def empty_db(request, session_factory):
    """An SQLAlchemy Session Maker fixture with all tables dropped"""
    session = session_factory()
    drop_tables(get_config(), session)
    return session_factory


@pytest.fixture(scope="session")
def db_tables(request, empty_db):
    """An SQLAlchemy Session Maker fixture with all tables
    based on testing.ini"""

    app_settings_file = request.config.getoption('test_settings_file')
    assert app_settings_file
    from assembl.conftest import engine
    bootstrap_db(app_settings_file, engine)
    transaction.commit()

    def fin():
        print "finalizer db_tables"
        session = empty_db()
        drop_tables(get_config(), session)
        transaction.commit()
    request.addfinalizer(fin)
    return empty_db  # session_factory


@pytest.fixture(scope="session")
def base_registry(request):
    """A Zope registry that is configured by with the testing.ini"""
    from assembl.views.traversal import root_factory
    from pyramid.config import Configurator
    from zope.component import getGlobalSiteManager
    registry = getGlobalSiteManager()
    config = Configurator(registry)
    config.setup_registry(
        settings=get_config(), root_factory=root_factory)
    configure_tasks(registry, 'assembl')
    config.add_tween('assembl.tests.utils.committing_session_tween_factory')
    return registry


@pytest.fixture(scope="module")
def test_app_no_perm(request, base_registry, db_tables):
    """A configured Assembl fixture with no permissions"""
    global_config = {
        '__file__': request.config.getoption('test_settings_file'),
        'here': get_distribution('assembl').location
    }
    app = TestApp(assembl.main(
        global_config, nosecurity=True, **get_config()))
    app.PyramidWebTestRequest = PyramidWebTestRequest
    return app


@pytest.fixture(scope="function")
def test_webrequest(request, test_app_no_perm):
    """A Pyramid request fixture with no user authorized"""
    req = PyramidWebTestRequest.blank('/', method="GET")

    def fin():
        print "finalizer test_webrequest"
        # The request was not called
        manager.pop()
    request.addfinalizer(fin)
    return req


@pytest.fixture(scope="module")
def db_default_data(
        request, db_tables, base_registry):
    """An SQLAlchemy Session Maker fixture that is preloaded
    with all Assembl tables, constraints, relationships, etc."""

    bootstrap_db_data(db_tables)
    transaction.commit()

    def fin():
        print "finalizer db_default_data"
        session = db_tables()
        clear_rows(get_config(), session)
        transaction.commit()
        from assembl.models import Locale, LangString
        Locale.reset_cache()
        LangString.reset_cache()
    request.addfinalizer(fin)
    return db_tables  # session_factory


@pytest.fixture(scope="function")
def test_session(request, db_default_data):
    """An SQLAlchemy Session Maker fixture-
    Use this session fixture for all fixture purposes"""

    session = db_default_data()

    def fin():
        print "finalizer test_session"
        try:
            session.commit()
            #session.close()
        except Exception:
            session.rollback()
    request.addfinalizer(fin)
    return session


@pytest.fixture(scope="function")
def admin_user(request, test_session, db_default_data):
    """A User fixture with R_SYSADMIN role"""

    from assembl.models import User, UserRole, Role
    u = User(name=u"Mr. Administrator", type="user")
    test_session.add(u)
    r = Role.get_role(R_SYSADMIN, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    test_session.flush()
    uid = u.id

    def fin():
        print "finalizer admin_user"
        # I often get expired objects here, and I need to figure out why
        user = test_session.query(User).get(uid)
        user_role = user.roles[0]
        test_session.delete(user_role)
        test_session.delete(user)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def test_adminuser_webrequest(request, admin_user, test_app_no_perm):
    """A Pyramid request fixture with an ADMIN user authorized"""
    req = PyramidWebTestRequest.blank('/', method="GET")
    req.authenticated_userid = admin_user.id

    def fin():
        # The request was not called
        manager.pop()
    request.addfinalizer(fin)
    return req


@pytest.fixture(scope="function")
def test_app(request, admin_user, test_app_no_perm):
    """A configured Assembl fixture with permissions
    and an admin user logged in"""

    config = testing.setUp(
        registry=test_app_no_perm.app.registry,
        settings=get_config(),
    )
    dummy_policy = config.testing_securitypolicy(
        userid=admin_user.id, permissive=True)
    config.set_authorization_policy(dummy_policy)
    config.set_authentication_policy(dummy_policy)
    return test_app_no_perm


@pytest.fixture(scope="function")
def test_app_no_login(request, admin_user, test_app_no_perm):
    """A configured Assembl fixture with permissions
    and no user logged in"""
    config = testing.setUp(
        registry=test_app_no_perm.app.registry,
        settings=get_config(),
    )
    dummy_policy = config.testing_securitypolicy(
        userid=None, permissive=False)
    config.set_authorization_policy(dummy_policy)
    config.set_authentication_policy(dummy_policy)
    return test_app_no_perm


@pytest.fixture(scope="function")
def test_server(request, test_app, empty_db):
    """A uWSGI server fixture with permissions, admin user logged in"""

    server = WSGIServer(application=test_app.app)
    server.start()

    def fin():
        print "finalizer test_server"
        server.stop()
    request.addfinalizer(fin)
    return server


@pytest.fixture(scope="module")
def browser(request):
    """A Splinter-based browser fixture - used for integration
    testing"""

    from os.path import dirname
    # interference from system phantomjs
    phantomjs = dirname(dirname(dirname(dirname(__file__)))) +\
        "/assembl/static/js/node_modules/.bin/phantomjs"
    browser = Browser('phantomjs', executable_path=phantomjs)

    def fin():
        import signal
        print "finalizer browser"
        # Kill process so it does not linger
        # https://github.com/seleniumhq/selenium/issues/767
        browser.driver.service.process.send_signal(signal.SIGTERM)
        browser.quit()
    request.addfinalizer(fin)

    return browser


def base_fixture_dirname():
    from os.path import dirname
    return dirname(dirname(dirname(dirname(__file__)))) +\
        "/assembl/static/js/app/tests/fixtures/"


def api_call_to_fname(api_call, **args):
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
    fname += ".json"
    return os.path.join(api_dir, fname)


@pytest.fixture(scope="function")
def json_representation_of_fixtures(
        request, discussion, jack_layton_linked_discussion, test_app):
    api_loc = "/api/v1/discussion/%d/ideas" % discussion.id
    r = test_app.get(api_loc)
    assert r.status_code == 200
    with open(api_call_to_fname(api_loc), "w") as f:
        f.write(r.body)

    def fin():
        from shutil import rmtree
        from os.path import isdir
        print "finalizer json_representation_of_fixtures"
        base_fixture_dir = base_fixture_dirname()
        if isdir(base_fixture_dir + "api"):
            rmtree(base_fixture_dir + "api")
        if isdir(base_fixture_dir + "data"):
            rmtree(base_fixture_dir + "data")

    request.addfinalizer(fin)

    return None
