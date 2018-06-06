# -*- coding=utf-8 -*-
from graphql_relay.node.node import from_global_id, to_global_id

from assembl.graphql.schema import Schema as schema


def test_query_timeline(graphql_request, discussion_with_2_phase_interface_v2, graphql_registry):
    res = schema.execute(
        graphql_registry['Timeline'],
        context_value=graphql_request,
        variable_values={"lang": u"en"}
    )
    assert res.errors is None
    assert len(res.data['timeline']) == 2
    phase1 = res.data['timeline'][0]
    assert phase1['identifier'] == 'survey'
    assert phase1['title'] == 'phase 1'
    assert phase1['titleEntries'][0]['localeCode'] == 'en'
    assert phase1['titleEntries'][0]['value'] == 'phase 1'
    assert phase1['start'] == '2014-12-31T09:00:00+00:00'
    assert phase1['end'] == '2015-12-31T09:00:00+00:00'
    phase2 = res.data['timeline'][1]
    assert phase2['identifier'] == 'thread'
    assert phase2['title'] == 'phase 2'
    assert phase2['titleEntries'][0]['localeCode'] == 'en'
    assert phase2['titleEntries'][0]['value'] == 'phase 2'
    assert phase2['start'] == '2015-12-31T09:01:00+00:00'
    assert phase2['end'] == '2049-12-31T09:00:00+00:00'


def test_mutation_create_discussion_phase(graphql_request, discussion_with_2_phase_interface_v2, graphql_registry):
    res = schema.execute(
        graphql_registry['createDiscussionPhase'],
        context_value=graphql_request,
        variable_values={
            "lang": u"en",
            "identifier": u"voteSession",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new phase" }
            ],
            "start": '2018-01-20T09:01:00.000001Z',
            "end": '2018-05-20T00:00:00.100001Z',
        }
    )
    assert res.errors is None
    phase = res.data['createDiscussionPhase']['discussionPhase']
    assert phase['id']
    assert phase['identifier'] == u'voteSession'
    assert phase['title'] == u'My new phase'
    assert phase['titleEntries'][0]['localeCode'] == u'en'
    assert phase['titleEntries'][0]['value'] == u'My new phase'
    assert phase['start'] == u'2018-01-20T09:01:00.000001+00:00'
    assert phase['end'] == u'2018-05-20T00:00:00.100001+00:00'


def test_mutation_update_discussion_phase(graphql_request, discussion_with_2_phase_interface_v2, timeline_phase2_interface_v2, graphql_registry):
    phase1 = discussion_with_2_phase_interface_v2.timeline_events[0]
    phase1_id = to_global_id('DiscussionPhase', phase1.id)
    res = schema.execute(
        graphql_registry['updateDiscussionPhase'],
        context_value=graphql_request,
        variable_values={
            "id": phase1_id,
            "lang": u"en",
            "identifier": u"multiColumn",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new title" }
            ],
            "start": '2018-01-20T09:01:00.000001Z',
            "end": '2018-05-20T00:00:00.100001Z',
        }
    )
    assert res.errors is None
    phase1_updated = res.data['updateDiscussionPhase']['discussionPhase']
    assert phase1_updated['id'] == phase1_id
    assert phase1_updated['identifier'] == 'multiColumn'
    assert phase1_updated['title'] == u'My new title'
    assert phase1_updated['titleEntries'][0]['localeCode'] == u'en'
    assert phase1_updated['titleEntries'][0]['value'] == u'My new title'
    assert phase1_updated['start'] == u'2018-01-20T09:01:00.000001+00:00'
    assert phase1_updated['end'] == u'2018-05-20T00:00:00.100001+00:00'
