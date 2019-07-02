# -*- coding: utf-8 -*-
from datetime import datetime
import pytest
from __future__ import print_function

@pytest.fixture(scope="function")
def timeline_phase2_interface_v1(request, test_app, test_session, discussion, subidea_1, subidea_2):
    from assembl.models import DiscussionPhase, LangString
    phase1 = DiscussionPhase(
        identifier='survey',
        discussion=discussion,
        title=LangString.create('phase 1', 'en'),
        description=LangString.create('A first exploratory phase', 'en'),
        root_idea=subidea_1,
        start=datetime(2014, 12, 31, 9),
        end=datetime(2015, 12, 31, 9),
        interface_v1=True
    )
    test_session.add(phase1)
    phase2 = DiscussionPhase(
        identifier='thread',
        discussion=discussion,
        title=LangString.create('phase 2', 'en'),
        description=LangString.create('A second divergent phase', 'en'),
        root_idea=subidea_2,
        start=datetime(2015, 12, 31, 9, 1),
        end=datetime(2049, 12, 31, 9),
        previous_event=phase1,
        order=2.0,
        interface_v1=True
    )
    test_session.add(phase2)
    test_session.flush()

    def fin():
        print("finalizer timeline")
        phase2.previous_event = None
        phase2.previous_event_id = None
        phase2.delete()
        phase1.delete()

        test_session.flush()

    request.addfinalizer(fin)
    return phase2


@pytest.fixture(scope="function")
def timeline_phase2_interface_v2(request, test_app, test_session, discussion, subidea_1, subidea_2):
    from assembl.models import DiscussionPhase, LangString
    phase1 = DiscussionPhase(
        identifier='survey',
        discussion=discussion,
        title=LangString.create('phase 1', 'en'),
        description=LangString.create('A first exploratory phase', 'en'),
        root_idea=subidea_1,
        start=datetime(2014, 12, 31, 9),
        end=datetime(2015, 12, 31, 9),
        interface_v1=False
    )
    test_session.add(phase1)
    phase2 = DiscussionPhase(
        identifier='thread',
        discussion=discussion,
        title=LangString.create('phase 2', 'en'),
        description=LangString.create('A second divergent phase', 'en'),
        root_idea=subidea_2,
        start=datetime(2015, 12, 31, 9, 1),
        end=datetime(2049, 12, 31, 9),
        previous_event=phase1,
        order=2.0,
        interface_v1=False
    )
    test_session.add(phase2)
    test_session.flush()

    def fin():
        print("finalizer timeline")
        phase2.previous_event = None
        phase2.previous_event_id = None
        phase2.delete()
        phase1.delete()
        test_session.flush()

    request.addfinalizer(fin)
    return phase2


@pytest.fixture(scope="function")
def timeline_vote_session(request, test_session, discussion):
    from assembl.models import DiscussionPhase, LangString

    phase = DiscussionPhase(
        discussion=discussion,
        identifier='voteSession',
        title=LangString.create(u"voteSession phase title fixture", "en"),
        description=LangString.create(u"voteSession phase description fixture", "en"),
        start=datetime(2014, 12, 31, 9, 0, 0),
        end=datetime(2015, 12, 31, 9, 0, 0),
        interface_v1=False,
        image_url=u'https://example.net/image.jpg'
    )


    # Create the phase
    test_session.add(phase)
    test_session.flush()

    def fin():
        print("finalizer timeline")
        test_session.delete(phase)
        test_session.flush()

    request.addfinalizer(fin)
    return phase
