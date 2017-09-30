import json
import pytest
from datetime import datetime, timedelta


@pytest.fixture(scope="function")
def creativity_session_widget(
        request, test_session, discussion, subidea_1):
    """A Creativity Session Widget fixture bound to subidea_1"""

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
    """An Idea fixture with an bound ideaLink,
    GeneratedIdeaWidgetLink, and a IdeaProposalPost"""

    from assembl.models import (Idea, IdeaLink, GeneratedIdeaWidgetLink,
                                IdeaProposalPost, LangString)
    i = Idea(
        discussion=discussion,
        title=LangString.create(u"generated idea", 'en'))
    test_session.add(i)
    l_1_wi = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_wi)
    l_w_wi = GeneratedIdeaWidgetLink(
        widget=creativity_session_widget,
        idea=i)
    ipp = IdeaProposalPost(
        proposes_idea=i, creator=participant1_user, discussion=discussion,
        message_id='proposal@example.com',
        subject=LangString.create(u"propose idea"),
        body=LangString.EMPTY(test_session))
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
    """A Post fixture with a bound to a creativity widget to a new idea and
    an idea content link"""

    from assembl.models import (Post, IdeaContentWidgetLink, LangString)
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"re: generated idea"),
        body=LangString.create(u"post body"),
        type="post", message_id="comment_generated@example.com")
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

    return p
