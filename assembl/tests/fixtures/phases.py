from datetime import datetime
import pytest
from __future__ import print_function

@pytest.fixture(scope="function")
def phases(request, test_session, discussion):
    from assembl.models import DiscussionPhase, LangString
    from assembl import models

    survey = DiscussionPhase(
        discussion=discussion,
        identifier='survey',
        title=LangString.create(u"survey phase title fixture", "en"),
        description=LangString.create(u"survey phase description fixture", "en"),
        start=datetime(2018, 1, 15, 9, 0, 0),
        end=datetime(2018, 2, 15, 9, 0, 0),
        interface_v1=False,
        image_url=u'https://example.net/image.jpg',
        is_thematics_table=True
    )

    thread = DiscussionPhase(
        discussion = discussion,
        identifier = 'thread',
        title = LangString.create(u"thread phase title fixture", "en"),
        description = LangString.create(u"thread phase description fixture", "en"),
        start = datetime(2018, 2, 16, 9, 0, 0),
        end = datetime(2018, 3, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg'
    )

    multiColumns = DiscussionPhase(
        discussion = discussion,
        identifier = 'multiColumns',
        title = LangString.create(u"multiColumns phase title fixture", "en"),
        description = LangString.create(u"multiColumns phase description fixture", "en"),
        start = datetime(2018, 3, 16, 9, 0, 0),
        end = datetime(2018, 4, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg'
    )

    voteSession = DiscussionPhase(
        discussion = discussion,
        identifier = 'voteSession',
        title = LangString.create(u"voteSession phase title fixture", "en"),
        description = LangString.create(u"voteSession phase description fixture", "en"),
        start = datetime(2018, 4, 16, 9, 0, 0),
        end = datetime(2018, 5, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg',
        is_thematics_table = True
    )

    brightMirror = DiscussionPhase(
        discussion = discussion,
        identifier = 'brightMirror',
        title = LangString.create(u"brightMirror phase title fixture", "en"),
        description = LangString.create(u"brightMirror phase description fixture", "en"),
        start = datetime(2018, 6, 16, 9, 0, 0),
        end = datetime(2018, 7, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg',
        is_thematics_table = True
    )

    # Create the phase
    test_session.add(survey)
    test_session.add(thread)
    test_session.add(multiColumns)
    test_session.add(voteSession)
    test_session.add(brightMirror)
    test_session.flush()

    def fin():
        print("finalizer timeline")
        test_session.delete(survey)
        test_session.delete(thread)
        test_session.delete(multiColumns)
        test_session.delete(voteSession)
        test_session.delete(brightMirror)
        test_session.flush()

    request.addfinalizer(fin)
    phases = test_session.query(models.DiscussionPhase).all()
    return {p.identifier: p for p in phases}
