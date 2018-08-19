# -*- coding: utf-8 -*-
import pytest

@pytest.fixture(scope="function")
def bright_mirror(phases, graphql_request, graphql_registry, test_session):
    import os
    from io import BytesIO
    from assembl.graphql.schema import Schema as schema

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': [
                {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
            ],
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [
                    {'value': u"Title FR announce", 'localeCode': u"fr"},
                    {'value': u"Title EN announce", 'localeCode': u"en"}
                ],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ]
            }
        })

    bright_mirror_id = res.data['createThematic']['thematic']['id']
    return bright_mirror_id
