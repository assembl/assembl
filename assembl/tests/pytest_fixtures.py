
import logging
import sys

import pytest
from pyramid import testing
from pyramid.paster import get_appsettings
import transaction
from webtest import TestApp
from pkg_resources import get_distribution

import assembl
from assembl.lib.migration import bootstrap_db
from assembl.lib.sqla import get_session_maker
from .utils import clear_rows, drop_tables
from .pytest_plugin import engine


@pytest.fixture(scope="session")
def app_settings(request):
    app_settings_file = request.config.getoption('test_settings_file')
    return get_appsettings(app_settings_file)


@pytest.fixture(scope="session")
def session_factory(request):
    session_factory = get_session_maker()

    def fin():
        session_factory.remove()
    request.addfinalizer(fin)
    return session_factory


@pytest.fixture(scope="session")
def empty_db(request, app_settings, session_factory):
    session = session_factory()
    drop_tables(app_settings, session)

    def fin():
        session = session_factory()
        drop_tables(app_settings, session)
        transaction.commit()
    request.addfinalizer(fin)
    return session_factory


@pytest.fixture(scope="session")
def db_tables(request, empty_db, app_settings):
    app_settings_file = request.config.getoption('test_settings_file')
    assert app_settings_file
    bootstrap_db(app_settings_file, engine)
    transaction.commit()

    def fin():
        session = empty_db()
        drop_tables(app_settings, session)
        transaction.commit()
    request.addfinalizer(fin)
    return empty_db


@pytest.fixture(scope="module")
def module_session(request, db_tables):
    session = db_tables()

    def fin():
        session.rollback()
    request.addfinalizer(fin)
    return session


@pytest.fixture(scope="module")
def discussion(request, module_session):
    from assembl.models import Discussion
    d = Discussion(topic=u"Jack Layton", slug="jacklayton2")
    module_session.add(d)
    module_session.flush()

    def fin():
        module_session.delete(d)
    return d


@pytest.fixture(scope="module")
def admin_user(request, module_session):
    from assembl.models import User, UserRole, Role
    from assembl.auth import R_SYSADMIN
    u = User(name=u"Mr. Adminstrator", type="user")
    module_session.add(u)
    r = Role.get_role(module_session, R_SYSADMIN)
    ur = UserRole(user=u, role=r)
    module_session.add(ur)
    module_session.flush()

    def fin():
        module_session.delete(u)
    return u


@pytest.fixture(scope="module")
def test_app(request, app_settings, admin_user):
    global_config = {
        '__file__': request.config.getoption('test_settings_file'),
        'here': get_distribution('assembl').location
    }
    app = TestApp(assembl.main(
        global_config, nosecurity=True, **app_settings))
    config = testing.setUp(
                registry=app.app.registry,
                settings=app_settings,
            )
    dummy_policy = config.testing_securitypolicy(
        userid=admin_user.id, permissive=True)
    config.set_authorization_policy(dummy_policy)
    config.set_authentication_policy(dummy_policy)
    return app


@pytest.fixture(scope="module")
def participant1_user(request, module_session):
    from assembl.models import User, UserRole, Role
    from assembl.auth import R_PARTICIPANT
    u = User(name=u"A. Barking Loon", type="user")
    module_session.add(u)
    r = Role.get_role(module_session, R_PARTICIPANT)
    ur = UserRole(user=u, role=r)
    module_session.add(ur)
    module_session.flush()

    def fin():
        module_session.delete(u)
    return u


@pytest.fixture(scope="module")
def participant2_user(request, module_session):
    from assembl.models import User, UserRole, Role
    from assembl.auth import R_PARTICIPANT
    u = User(name=u"James T. Expert", type="user")
    module_session.add(u)
    r = Role.get_role(module_session, R_PARTICIPANT)
    ur = UserRole(user=u, role=r)
    module_session.add(ur)
    module_session.flush()

    def fin():
        module_session.delete(u)
    return u


@pytest.fixture(scope="module")
def mailbox(request, discussion, module_session):
    from assembl.models import Mailbox
    m = Mailbox(discussion=discussion)
    module_session.add(m)
    module_session.flush()

    def fin():
        module_session.delete(m)
    return m


@pytest.fixture(scope="module")
def post_source(request, discussion, module_session):
    from assembl.models import PostSource
    ps = PostSource(
        discussion=discussion, name='a source', type='post_source')
    module_session.add(ps)
    module_session.flush()

    def fin():
        module_session.delete(ps)
    return ps


@pytest.fixture(scope="module")
def root_post_1(request, participant1_user, discussion, module_session):
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator = participant1_user,
        subject=u"a root post", body=u"post body",
        type="post", message_id="msg1")
    module_session.add(p)
    module_session.flush()

    def fin():
        module_session.delete(p)
    return p


@pytest.fixture(scope="module")
def reply_post_1(request, participant2_user, discussion, root_post_1, module_session):
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator = participant2_user,
        subject=u"re1: root post", body=u"post body",
        type="post", message_id="msg2", parent=root_post_1)
    module_session.add(p)
    module_session.flush()

    def fin():
        module_session.delete(p)
    return p


@pytest.fixture(scope="module")
def reply_post_2(request, participant2_user, discussion, reply_post_1, module_session):
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator = participant2_user,
        subject=u"re2: root post", body=u"post body",
        type="post", message_id="msg3", parent=reply_post_1)
    module_session.add(p)
    module_session.flush()

    def fin():
        module_session.delete(p)
    return p


@pytest.fixture(scope="module")
def reply_post_3(request, participant2_user, discussion, root_post_1, module_session):
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator = participant2_user,
        subject=u"re2: root post", body=u"post body",
        type="post", message_id="msg4", parent=root_post_1)
    module_session.add(p)
    module_session.flush()

    def fin():
        module_session.delete(p)
    return p


@pytest.fixture(scope="module")
def extract(request, participant2_user, reply_post_2, discussion, module_session):
    from assembl.models import Extract
    e = Extract(
        body=u"body",
        creator=participant2_user,
        owner=participant2_user,
        content=reply_post_2,
        #idea_id=IdeaData.idea21.id,
        discussion=discussion)
    module_session.add(e)
    module_session.flush()

    def fin():
        module_session.delete(e)
    return e



# class RootIdeaData(DataSet):
#     class root_idea:
#         #A root idea is created by the discussion, so this is not truly the
#         #root idea...
#         id = 2
#         discussion = DiscussionData.jacklayton


# class IdeaData(DataSet):
#     class idea1:
#         id = 3
#         discussion = DiscussionData.jacklayton
#         short_title = u"idea 1"

#     class idea11:
#         id = 4
#         discussion = DiscussionData.jacklayton
#         short_title = u"idea 1.1"

#     class idea2:
#         id = 5
#         discussion = DiscussionData.jacklayton
#         short_title = u"idea 2"

#     class idea21:
#         id = 6
#         discussion = DiscussionData.jacklayton
#         short_title = u"idea 2.1"

#     class idea211:
#         id = 7
#         discussion = DiscussionData.jacklayton
#         short_title = u"idea 2.1.1"

# class IdeaLinkData(DataSet):
#     class link_r_1:
#         source = RootIdeaData.root_idea
#         target = IdeaData.idea1

#     class link_1_11:
#         source = IdeaData.idea1
#         target = IdeaData.idea11

#     class link_r_2:
#         source = RootIdeaData.root_idea
#         target = IdeaData.idea2

#     class link_2_21:
#         source = IdeaData.idea2
#         target = IdeaData.idea21

#     class link_21_211:
#         source = IdeaData.idea21
#         target = IdeaData.idea211