# -*- coding: utf-8 -*-
import pytest

@pytest.fixture(scope="function")
def bright_mirror(graphql_request, test_session):
    import os
    from io import BytesIO
    from assembl.graphql.schema import Schema as schema

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        u"""
            mutation CreateBrightMirror($img:String!) {
            createBrightMirror(
                titleEntries: [
                        {value: "Comprendre les dynamiques et les enjeux", localeCode: "fr"},
                        {value: "Understanding the dynamics and issues", localeCode: "en"}
                        ],
                descriptionEntries: [
                        {value: "Desc FR", localeCode: "fr"},
                        {value: "Desc EN", localeCode: "en"}
                        ],
                image:$img,
                announcement: {
                titleEntries: [
                        {value: "Title FR announce", localeCode: "fr"},
                        {value: "Title EN announce", localeCode: "en"}
                        ],
                bodyEntries: [
                        {value: "Body FR announce", localeCode: "fr"},
                        {value: "Body EN announce", localeCode: "en"}
                        ]
                }
            )
            {
                brightMirror {
                    id
                    title
                    description
                    img {
                        title
                    }
                    announcement {
                        title
                        body
                    }
                    messageViewOverride
                    }
                }
            }
            """, context_value=graphql_request,
                variable_values={"img": u"variables.img"})
    bright_mirror_id = res.data['createBrightMirror']['brightMirror']['id']
    return bright_mirror_id
