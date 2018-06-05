# -*- coding=utf-8 -*-
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
