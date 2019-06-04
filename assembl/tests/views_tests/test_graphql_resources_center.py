# -*- coding: utf-8 -*-
import json
import pytest
import mock
from graphql_relay.node.node import to_global_id
from graphql_relay.connection.arrayconnection import offset_to_cursor

from assembl.models import DiscussionAttachment, LangString
from assembl.graphql.schema import Schema as schema
from assembl.tests.utils import FakeUploadedFile


def test_query_has_resources_center(discussion, resource, resource_with_image_and_doc, graphql_request):
    query = u"""
query { hasResourcesCenter }
"""
    res = schema.execute(query, context_value=graphql_request)
    assert res.data['hasResourcesCenter'] is True


def test_query_resources(graphql_registry, discussion, resource, resource_with_image_and_doc, graphql_request):
    res = schema.execute(
        graphql_registry['ResourcesQuery'],
        variable_values={
            "lang": u"en"
        },
        context_value=graphql_request)
    assert res.data['resources'][0]['order'] == 1.0
    assert res.data['resources'][1]['order'] == 2.0

    first_resource = res.data['resources'][0]
    second_resource = res.data['resources'][1]

    assert first_resource['title'] == u'another resource'
    assert second_resource['title'] == u'a resource'

    assert second_resource['text'] == u'Lorem ipsum dolor sit amet'
    assert second_resource['embedCode'] == u'<iframe ...>'
    assert second_resource['doc'] == None
    assert second_resource['image'] == None

    assert '/documents/' in first_resource['image']['externalUrl']
    assert '/documents/' in first_resource['doc']['externalUrl']
    # this is the title of the File object, not the title of the ResourceAttachment object
    assert first_resource['doc']['title'] == "mydocument.pdf"


def test_mutation_create_resource_no_permission(graphql_registry, graphql_request):
    graphql_request.authenticated_userid = None
    res = schema.execute(
        graphql_registry['createResource'],
        variable_values={
            "lang": u"en",
            "textEntries": [],
            "titleEntries": [{"value": u"Peu importe", "localeCode": u"fr"}]
        },
        context_value=graphql_request
    )
    assert json.loads(json.dumps(res.data)) == {u'createResource': None}


def test_mutation_create_resource(graphql_registry, graphql_request):
    title_entries = [
        {
            "value": u"Première ressource",
            "localeCode": u"fr"
        },
        {
            "value": u"First resource",
            "localeCode": u"en"
        }
    ]
    text_entries = [
        {
            "value": u"Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            "localeCode": u"fr"
        },
        {
            "value": u"Foobar",
            "localeCode": u"en"
        }
    ]
    embed_code = u'iframe foobar'

    graphql_request.POST['variables.img'] = FakeUploadedFile(
        u'path/to/img.png', 'image/png')
    graphql_request.POST['variables.doc'] = FakeUploadedFile(
        u'path/to/mydoc.pdf', 'application/pdf')

    res = schema.execute(
        graphql_registry['createResource'],
        context_value=graphql_request,
        variable_values={
            "image": u"variables.img",
            "doc": u"variables.doc",
            "lang": u"fr",
            "titleEntries": title_entries,
            "textEntries": text_entries,
            "embedCode": embed_code,
            "order": 5.0
        }
    )
    result = res.data
    assert result is not None
    assert result['createResource'] is not None
    resource = result['createResource']['resource']
    assert resource['title'] == u'Première ressource'
    assert resource['text'] == u'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
    assert resource['embedCode'] == u'iframe foobar'
    assert resource['order'] == 5.0

    assert '/documents/' in resource['image']['externalUrl']
    assert resource['image']['title'] == 'img.png'

    assert '/documents/' in resource['doc']['externalUrl']
    assert resource['doc']['title'] == 'mydoc.pdf'


def test_delete_resource(graphql_registry, graphql_request, resource):
    resource_id = to_global_id('Resource', resource.id)
    res = schema.execute(
        graphql_registry['deleteResource'],
        variable_values={
            "resourceId": resource_id
        },
        context_value=graphql_request)
    assert res.data['deleteResource']['success'] is True
    res = schema.execute(
        u'query { resources { id } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {u'resources': []}


def test_update_resource(graphql_registry, graphql_request, resource_with_image_and_doc):
    resource = resource_with_image_and_doc
    resource_id = to_global_id('Resource', resource.id)

    graphql_request.POST['variables.img'] = FakeUploadedFile(
        u'path/to/new-img.png', 'image/png')
    graphql_request.POST['variables.doc'] = FakeUploadedFile(
        u'path/to/new-doc.pdf', 'application/pdf')

    res = schema.execute(
        graphql_registry['updateResource'],
        context_value=graphql_request,
        variable_values={
            "id": resource_id,
            "image": u"variables.img",
            "doc": u"variables.doc",
            "embedCode": u"nothing",
            "lang": u"fr",
            "order": 42.0,
            "titleEntries": [
                {
                    "value": u"My resource",
                    "localeCode": u"en"
                },
                {
                    "value": u"Ma ressource",
                    "localeCode": u"fr"
                }
            ],
            "textEntries": [
                {
                    "value": u"Text in english",
                    "localeCode": u"en"
                },
                {
                    "value": u"Texte en français",
                    "localeCode": u"fr"
                }
            ],
        }
    )
    assert res.data is not None
    assert res.data['updateResource'] is not None
    assert res.data['updateResource']['resource'] is not None
    resource = res.data['updateResource']['resource']
    assert resource[u'title'] == u'Ma ressource'
    assert resource[u'text'] == u'Texte en français'
    assert resource[u'embedCode'] == u'nothing'
    assert resource[u'order'] == 42.0

    assert '/documents/' in resource['image']['externalUrl']
    assert resource['image']['title'] == 'new-img.png'

    assert '/documents/' in resource['doc']['externalUrl']
    assert resource['doc']['title'] == 'new-doc.pdf'


def test_query_discussion_resources_center_fields(
        discussion, graphql_request, test_session, simple_file, moderator_user):

    header_image = DiscussionAttachment(
        discussion=discussion,
        document=simple_file,
        title=u"Resource center header image",
        creator=moderator_user,
        attachmentPurpose='RESOURCES_CENTER_HEADER_IMAGE'
    )

    discussion.resources_center_title = LangString.create(
        u"Resources center", "en")
    discussion.db.flush()

    res = schema.execute(u"""query {
        resourcesCenter {
            title(lang:"en")
            titleEntries {
                localeCode
                value
            }
            headerImage {
                externalUrl
                mimeType
            }
        }
    }""", context_value=graphql_request)
    res_data = json.loads(json.dumps(res.data))
    assert res_data['resourcesCenter']['title'] == u'Resources center'
    assert res_data['resourcesCenter']['titleEntries'][0]['localeCode'] == u'en'
    assert res_data['resourcesCenter']['titleEntries'][0]['value'] == u'Resources center'
    assert res_data['resourcesCenter']['headerImage']['mimeType'] == u'image/png'
    assert '/documents/' in res_data['resourcesCenter']['headerImage']['externalUrl']

    discussion.db.delete(header_image)
    discussion.db.flush()


def test_update_resources_center(graphql_request, discussion):
    graphql_request.POST['variables.headerImage'] = FakeUploadedFile(
        u'path/to/new-img.png', 'image/png')

    res = schema.execute(u"""
mutation updateResourcesCenter($headerImage:String) {
    updateResourcesCenter(
        titleEntries: [
            {value: "My great resources center", localeCode: "en"},
            {value: "Mon super centre de ressources", localeCode: "fr"}
        ],
        headerImage: $headerImage,
    ) {
        resourcesCenter {
            titleEntries {
                localeCode
                value
            }
            headerImage {
                externalUrl
                title
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"headerImage": u"variables.headerImage"})
    assert res.data is not None

    assert res.data['updateResourcesCenter'] is not None
    assert res.data['updateResourcesCenter']['resourcesCenter'] is not None

    resources_center = res.data['updateResourcesCenter']['resourcesCenter']
    assert resources_center['titleEntries'][0]['localeCode'] == 'en'
    assert resources_center['titleEntries'][0]['value'] == 'My great resources center'
    assert resources_center['titleEntries'][1]['localeCode'] == 'fr'
    assert resources_center['titleEntries'][1]['value'] == 'Mon super centre de ressources'
    assert resources_center['headerImage'] is not None
    assert '/documents/' in resources_center['headerImage']['externalUrl']
    assert resources_center['headerImage']['title'] == 'new-img.png'
