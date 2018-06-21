# -*- coding: utf-8 -*-
from datetime import datetime
import pytest


@pytest.fixture(scope="function")
def timeline_phase2_interface_v1(request, test_app, test_session, discussion):
    url = "/data/Discussion/%d/timeline_events" % (discussion.id,)
    phase1 = {
        '@type': "DiscussionPhase",
        'identifier': 'survey',
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 1",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A first exploratory phase",
                "@language": "en"}]},
        'start': "20141231T09:00:00Z",
        'end': "20151231T09:00:00Z",
        'interface_v1': False
    }

    # Create the phase
    r = test_app.post_json(url, phase1)
    assert r.status_code == 201
    uri1 = r.location
    discussion.db.flush()

    # Create phase2
    phase2 = {
        '@type': "DiscussionPhase",
        'identifier': 'thread',
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 2",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A second divergent phase",
                "@language": "en"}]},
        'previous_event': uri1,
        'start': "20151231T09:01:00Z",
        'end': "20491231T09:00:00Z",
        'interface_v1': True
    }

    # Create the phase
    r = test_app.post_json(url, phase2)
    assert r.status_code == 201
    discussion.db.flush()

    def fin():
        print "finalizer timeline"
        for timeline_event in discussion.timeline_events:
            test_session.delete(timeline_event)

        test_session.flush()

    request.addfinalizer(fin)
    return phase2


@pytest.fixture(scope="function")
def timeline_phase2_interface_v2(request, test_app, test_session, discussion):
    url = "/data/Discussion/%d/timeline_events" % (discussion.id,)
    phase1 = {
        '@type': "DiscussionPhase",
        'identifier': 'survey',
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 1",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A first exploratory phase",
                "@language": "en"}]},
        'start': "20141231T09:00:00Z",
        'end': "20151231T09:00:00Z",
        'interface_v1': False
    }

    # Create the phase
    r = test_app.post_json(url, phase1)
    assert r.status_code == 201
    uri1 = r.location
    discussion.db.flush()

    # Create phase2
    phase2 = {
        '@type': "DiscussionPhase",
        'identifier': 'thread',
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 2",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A second divergent phase",
                "@language": "en"}]},
        'previous_event': uri1,
        'start': "20151231T09:01:00Z",
        'end': "20491231T09:00:00Z",
        'order': 2.0,
        'interface_v1': False
    }

    # Create the phase
    r = test_app.post_json(url, phase2)
    assert r.status_code == 201
    discussion.db.flush()

    def fin():
        print "finalizer timeline"
        for timeline_event in discussion.timeline_events:
            test_session.delete(timeline_event)

        test_session.flush()

    request.addfinalizer(fin)
    return phase2

@pytest.fixture(scope="function")
def timeline_vote_session(request, test_session, discussion):
    from assembl.models import DiscussionPhase, LangString

    phase = DiscussionPhase(
        discussion = discussion,
        identifier = 'voteSession',
        title = LangString.create(u"voteSession phase title fixture", "en"),
        description = LangString.create(u"voteSession phase description fixture", "en"),
        start = datetime(2014, 12, 31, 9, 0, 0),
        end = datetime(2015, 12, 31, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg'
    )


    # Create the phase
    test_session.add(phase)
    test_session.flush()

    def fin():
        print "finalizer timeline"
        test_session.delete(phase)
        test_session.flush()

    request.addfinalizer(fin)
    return phase
