
import logging
import sys
from datetime import datetime, timedelta

import pytest
from pytest_localserver.http import WSGIServer
from pyramid import testing
from pyramid.paster import get_appsettings
import transaction
from webtest import TestApp
from pkg_resources import get_distribution
import simplejson as json
from splinter import Browser
from sqlalchemy import inspect

import assembl
from assembl.lib.migration import bootstrap_db, bootstrap_db_data
from assembl.lib.sqla import get_typed_session_maker, set_session_maker_type
from assembl.tasks import configure as configure_tasks
from .utils import clear_rows, drop_tables
from assembl.auth import R_SYSADMIN, R_PARTICIPANT


def zopish_session_tween_factory(handler, registry):

    def zopish_session_tween(request):
        get_typed_session_maker(False).commit()
        set_session_maker_type(True)
        try:
            return handler(request)
        finally:
            set_session_maker_type(False)

    return zopish_session_tween


@pytest.fixture(scope="session")
def app_settings(request):
    from assembl.lib.config import set_config
    app_settings_file = request.config.getoption('test_settings_file')
    app_settings = get_appsettings(app_settings_file, 'assembl')
    set_config(app_settings)
    return app_settings


@pytest.fixture(scope="session")
def session_factory(request):
    # Get the zopeless session maker,
    # while the Webtest server will use the
    # default session maker, which is zopish.
    session_factory = get_typed_session_maker(False)

    def fin():
        print "finalizer session_factory"
        session_factory.remove()
    request.addfinalizer(fin)
    return session_factory


@pytest.fixture(scope="session")
def empty_db(request, app_settings, session_factory):
    session = session_factory()
    drop_tables(app_settings, session)
    return session_factory


@pytest.fixture(scope="session")
def db_tables(request, empty_db, app_settings):
    app_settings_file = request.config.getoption('test_settings_file')
    assert app_settings_file
    from ..conftest import engine
    bootstrap_db(app_settings_file, engine)
    transaction.commit()

    def fin():
        print "finalizer db_tables"
        session = empty_db()
        drop_tables(app_settings, session)
        transaction.commit()
    request.addfinalizer(fin)
    return empty_db  # session_factory


@pytest.fixture(scope="session")
def base_registry(request, app_settings):
    from assembl.views.traversal import root_factory
    from pyramid.config import Configurator
    from zope.component import getGlobalSiteManager
    registry = getGlobalSiteManager()
    config = Configurator(registry)
    config.setup_registry(
        settings=app_settings, root_factory=root_factory)
    configure_tasks(registry, 'assembl')
    config.add_tween('assembl.tests.pytest_fixtures.zopish_session_tween_factory')
    return registry


@pytest.fixture(scope="module")
def test_app_no_perm(request, app_settings, base_registry):
    global_config = {
        '__file__': request.config.getoption('test_settings_file'),
        'here': get_distribution('assembl').location
    }
    return TestApp(assembl.main(
        global_config, nosecurity=True, **app_settings))


@pytest.fixture(scope="module")
def db_default_data(request, db_tables, app_settings, base_registry):
    bootstrap_db_data(db_tables)
    #db_tables.commit()
    transaction.commit()

    def fin():
        print "finalizer db_default_data"
        session = db_tables()
        clear_rows(app_settings, session)
        transaction.commit()
    request.addfinalizer(fin)
    return db_tables  # session_factory


@pytest.fixture(scope="function")
def test_session(request, db_default_data):
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
def discussion(request, test_session):
    from assembl.models import Discussion
    d = Discussion(topic=u"Jack Layton", slug="jacklayton2", settings="{}",
                   session=test_session)
    test_session.add(d)
    test_session.add(d.next_synthesis)
    test_session.add(d.root_idea)
    test_session.add(d.table_of_contents)
    test_session.flush()

    def fin():
        print "finalizer discussion"
        discussion = d
        if inspect(d).detached:
            # How did this happen?
            discussion = test_session.query(Discussion).get(d.id)
        test_session.delete(discussion.table_of_contents)
        test_session.delete(discussion.root_idea)
        test_session.delete(discussion.next_synthesis)
        test_session.delete(discussion)
        test_session.flush()
    request.addfinalizer(fin)
    return d


@pytest.fixture(scope="function")
def discussion2(request, test_session):
    from assembl.models import Discussion
    d = Discussion(topic=u"Second discussion", slug="testdiscussion2")
    test_session.add(d)
    test_session.add(d.next_synthesis)
    test_session.add(d.root_idea)
    test_session.add(d.table_of_contents)
    test_session.flush()

    def fin():
        print "finalizer discussion2"
        test_session.delete(d.table_of_contents)
        test_session.delete(d.root_idea)
        test_session.delete(d.next_synthesis)
        test_session.delete(d)
        test_session.flush()
    request.addfinalizer(fin)
    return d


@pytest.fixture(scope="function")
def admin_user(request, test_session, db_default_data):
    from assembl.models import User, UserRole, Role
    u = User(name=u"Mr. Administrator", type="user")
    test_session.add(u)
    r = Role.get_role(R_SYSADMIN, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    test_session.flush()

    def fin():
        print "finalizer admin_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def test_app(request, admin_user, app_settings, test_app_no_perm):
    config = testing.setUp(
        registry=test_app_no_perm.app.registry,
        settings=app_settings,
    )
    dummy_policy = config.testing_securitypolicy(
        userid=admin_user.id, permissive=True)
    config.set_authorization_policy(dummy_policy)
    config.set_authentication_policy(dummy_policy)
    return test_app_no_perm


@pytest.fixture(scope="function")
def test_server(request, test_app):
    server = WSGIServer(application=test_app.app)
    server.start()
    request.addfinalizer(server.stop)
    return server


@pytest.fixture(scope="function")
def participant1_user(request, test_session, discussion):
    from assembl.models import User, UserRole, Role, EmailAccount
    u = User(name=u"A. Barking Loon", type="user", password="password", verified=True)
    email = EmailAccount(email="abloon@example.com", profile=u, verified=True)
    test_session.add(u)
    r = Role.get_role(R_PARTICIPANT, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    u.subscribe(discussion)
    test_session.flush()

    def fin():
        print "finalizer participant1_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def participant2_user(request, test_session):
    from assembl.models import User, UserRole, Role
    u = User(name=u"James T. Expert", type="user")
    test_session.add(u)
    r = Role.get_role(R_PARTICIPANT, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    test_session.flush()

    def fin():
        print "finalizer participant2_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def mailbox(request, discussion, test_session):
    from assembl.models import AbstractMailbox
    m = AbstractMailbox(
        discussion=discussion, name='mailbox')
    test_session.add(m)
    test_session.flush()

    def fin():
        print "finalizer mailbox"
        test_session.delete(m)
        test_session.flush()
    request.addfinalizer(fin)
    return m


@pytest.fixture(scope="function")
def jack_layton_mailbox(request, discussion, test_session):
    """ From https://dev.imaginationforpeople.org/redmine/projects/assembl/wiki/SampleDebate
    """
    import os
    from assembl.models import MaildirMailbox
    maildir_path = os.path.join(os.path.dirname(__file__),
                                'jack_layton_mail_fixtures_maildir')
    m = MaildirMailbox(discussion=discussion, name='Jack Layton fixture',
                       filesystem_path=maildir_path)
    m.do_import_content(m, only_new=True)
    test_session.add(m)
    test_session.flush()

    def fin():
        print "finalizer jack_layton_mailbox"
        agents = set()
        for post in m.contents:
            agents.add(post.creator)
            test_session.delete(post)
        for agent in agents:
            test_session.delete(agent)
        test_session.delete(m)
        test_session.flush()
    request.addfinalizer(fin)
    return m


@pytest.fixture(scope="function")
def post_source(request, discussion, test_session):
    from assembl.models import PostSource
    ps = PostSource(
        discussion=discussion, name='a source', type='post_source')
    test_session.add(ps)
    test_session.flush()

    def fin():
        print "finalizer post_source"
        test_session.delete(ps)
        test_session.flush()
    request.addfinalizer(fin)
    return ps


@pytest.fixture(scope="function")
def root_post_1(request, participant1_user, discussion, test_session):
    """
    From participant1_user
    """
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=u"a root post", body=u"post body",
        type="post", message_id="msg1")
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer root_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def discussion2_root_post_1(request, participant1_user, discussion2, test_session):
    """
    From participant1_user
    """
    from assembl.models import Post
    p = Post(
        discussion=discussion2, creator=participant1_user,
        subject=u"a root post", body=u"post body",
        type="post", message_id="msg1")
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer discussion2_root_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def synthesis_post_1(request, participant1_user, discussion, test_session, synthesis_1):
    from assembl.models import SynthesisPost
    p = SynthesisPost(
        discussion=discussion, creator=participant1_user,
        subject=u"a synthesis post", body=u"post body (unused, it's a synthesis...)",
        message_id="msg1",
        publishes_synthesis = synthesis_1)
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer synthesis_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_1(request, participant2_user, discussion,
                 root_post_1, test_session):
    """
    From participant2_user, in reply to root_post_1
    """
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator=participant2_user,
        subject=u"re1: root post", body=u"post body",
        type="post", message_id="msg2")
    test_session.add(p)
    test_session.flush()
    p.set_parent(root_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_2(request, participant1_user, discussion,
                 reply_post_1, test_session):
    """
    From participant1_user, in reply to reply_post_1
    """
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=u"re2: root post", body=u"post body",
        type="post", message_id="msg3")
    test_session.add(p)
    test_session.flush()
    p.set_parent(reply_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_2"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_3(request, participant2_user, discussion,
                 root_post_1, test_session):
    """
    From participant2_user, in reply to reply_post_2
    """
    from assembl.models import Post
    p = Post(
        discussion=discussion, creator=participant2_user,
        subject=u"re2: root post", body=u"post body",
        type="post", message_id="msg4")
    test_session.add(p)
    test_session.flush()
    p.set_parent(root_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_3"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def root_idea(request, discussion, test_session):
    return discussion.root_idea


@pytest.fixture(scope="function")
def subidea_1(request, discussion, root_idea, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="idea 1", discussion=discussion)
    test_session.add(i)
    l_r_1 = IdeaLink(source=root_idea, target=i)
    test_session.add(l_r_1)
    test_session.flush()

    def fin():
        print "finalizer subidea_1"
        test_session.delete(l_r_1)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1(request, discussion, subidea_1, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="idea 1.1", discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def criterion_1(request, discussion, subidea_1, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="cost", discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_1"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def criterion_2(request, discussion, subidea_1, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="quality", discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_2"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def criterion_3(request, discussion, subidea_1, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="time", discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_3"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def lickert_range(request, test_session):
    from assembl.models import LickertRange
    lr = LickertRange()
    test_session.add(lr)
    test_session.flush()

    def fin():
        print "finalizer lickert_range"
        test_session.delete(lr)
        test_session.flush()
    request.addfinalizer(fin)
    return lr


@pytest.fixture(scope="function")
def subidea_1_1_1(request, discussion, subidea_1_1, test_session):
    from assembl.models import Idea, IdeaLink
    i = Idea(short_title="idea 1.1.1", discussion=discussion)
    test_session.add(i)
    l_11_111 = IdeaLink(source=subidea_1_1, target=i)
    test_session.add(l_11_111)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1"
        test_session.delete(l_11_111)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def synthesis_1(request, discussion, subidea_1, subidea_1_1, test_session):
    from assembl.models import Synthesis, SubGraphIdeaAssociation,\
        SubGraphIdeaLinkAssociation
    s = Synthesis(discussion=discussion)
    test_session.add(s)
    i1_a = SubGraphIdeaAssociation(sub_graph=s, idea=subidea_1)
    test_session.add(i1_a)
    i11_a = SubGraphIdeaAssociation(sub_graph=s, idea=subidea_1_1)
    test_session.add(i11_a)
    l_1_11 = subidea_1_1.source_links[0]
    l_1_11_a = SubGraphIdeaLinkAssociation(sub_graph=s, idea_link=l_1_11)
    test_session.add(l_1_11_a)
    test_session.flush()

    def fin():
        print "finalizer synthesis_1"
        test_session.delete(l_1_11_a)
        test_session.delete(i11_a)
        test_session.delete(i1_a)
        test_session.delete(s)
        test_session.flush()
    request.addfinalizer(fin)

    return s


@pytest.fixture(scope="function")
def extract_post_1_to_subidea_1_1(
        request, participant2_user, reply_post_1,
        subidea_1_1, discussion, test_session):
    """ Links reply_post_1 to subidea_1_1 """
    from assembl.models import Extract
    e = Extract(
        body=u"body",
        creator=participant2_user,
        owner=participant2_user,
        content=reply_post_1,
        idea_id=subidea_1_1.id,  # strange bug: Using idea directly fails
        discussion=discussion)
    test_session.add(e)
    test_session.flush()

    def fin():
        print "finalizer extract_post_1_to_subidea_1_1"
        test_session.delete(e)
        test_session.flush()
    request.addfinalizer(fin)
    return e


@pytest.fixture(scope="function")
def creativity_session_widget(
        request, test_session, discussion, subidea_1):
    from assembl.models import CreativitySessionWidget
    test_session.flush()
    c = CreativitySessionWidget(
        discussion=discussion,
        settings=json.dumps({
            'idea': subidea_1.uri(),
            'notifications': [
                {
                    'start': '2014-01-01T00:00:00',
                    'end': format(datetime.utcnow() + timedelta(1)),
                    'message': 'creativity_session'
                }
            ]}))
    test_session.add(c)

    def fin():
        print "finalizer creativity_session_widget"
        test_session.delete(c)
        test_session.flush()
    request.addfinalizer(fin)

    return c


@pytest.fixture(scope="function")
def creativity_session_widget_new_idea(
        request, test_session, discussion, subidea_1,
        creativity_session_widget, participant1_user):
    from assembl.models import (Idea, IdeaLink, GeneratedIdeaWidgetLink,
                                IdeaProposalPost)
    i = Idea(
        discussion=discussion,
        short_title="generated idea")
    test_session.add(i)
    l_1_wi = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_wi)
    l_w_wi = GeneratedIdeaWidgetLink(
        widget=creativity_session_widget,
        idea=i)
    ipp = IdeaProposalPost(
        proposes_idea=i, creator=participant1_user, discussion=discussion,
        message_id='proposal', subject=u"propose idea", body="")
    test_session.add(ipp)
    def fin():
        print "finalizer creativity_session_widget_new_idea"
        test_session.delete(ipp)
        test_session.delete(l_w_wi)
        test_session.delete(l_1_wi)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)

    return i


@pytest.fixture(scope="function")
def creativity_session_widget_post(
        request, test_session, discussion, participant1_user,
        creativity_session_widget, creativity_session_widget_new_idea):
    from assembl.models import (Post, IdeaContentWidgetLink)
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=u"re: generated idea", body=u"post body",
        type="post", message_id="comment_generated")
    test_session.add(p)
    test_session.flush()
    icwl = IdeaContentWidgetLink(
        content=p, idea=creativity_session_widget_new_idea,
        creator=participant1_user)
    test_session.add(icwl)

    def fin():
        print "finalizer creativity_session_widget_post"
        test_session.delete(icwl)
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)

    return i


@pytest.fixture(scope="module")
def browser(request):
    browser = Browser()
    def fin():
        print "finalizer browser"
        browser.quit()
    request.addfinalizer(fin)

    return browser
