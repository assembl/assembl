from assembl.graphql.schema import Schema as schema
from graphql_relay.node.node import to_global_id
from assembl.models.landing_page import LandingPageModuleType
from assembl.tests.model_tests.test_landing_page import MODULES_COUNT


def test_query_landing_page_module_types(graphql_request):
    query = u"""query LandingPageModuleTypes($lang: String!) {
        landingPageModuleTypes {
            titleEntries {
                localeCode
                value
            }
            title(lang: $lang)
            defaultOrder
            editableOrder
            helperImgUrl
            identifier
            required
        }
    }
    """
    res = schema.execute(
        query,
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['landingPageModuleTypes']) == MODULES_COUNT
    for module_type in res.data['landingPageModuleTypes']:
        if module_type['identifier'] == 'INTRODUCTION':
            assert module_type['title'] == u'Introduction'
            assert module_type['defaultOrder'] == 2.0
            assert module_type['editableOrder'] is True
            assert module_type['helperImgUrl'] == u''
            assert module_type['required'] is False


def test_query_landing_page_modules(graphql_request, simple_landing_page_module):
    query = u"""query LandingPageModules($lang: String!) {
        landingPageModules {
            configuration
            enabled
            existsInDatabase
            id
            order
            moduleType {
                defaultOrder
                editableOrder
                identifier
                required
                title(lang: $lang)
            }
        }
    }
    """
    res = schema.execute(
        query,
        context_value=graphql_request,
        variable_values={"lang": u"en"})

    assert len(res.data[u'landingPageModules']) == MODULES_COUNT
    orders = []
    for lpm in res.data[u'landingPageModules']:
        orders.append(lpm['order'])
        if lpm[u'moduleType'][u'identifier'] == u'HEADER':
            # the LandingPageModule we created before
            assert lpm[u'existsInDatabase'] is True
            assert lpm[u'order'] == 42.0
            assert lpm[u'enabled'] is True
            assert lpm[u'configuration'] == u'{text:"The SDD feed is down, override the optical system so we can connect the SAS bus!"}'
            assert lpm[u'moduleType'][u'title'] == u'Header'
            assert lpm[u'moduleType'][u'defaultOrder'] == 1.0
            assert lpm[u'moduleType'][u'editableOrder'] is False
            assert lpm[u'moduleType'][u'required'] is True
        elif lpm[u'moduleType'][u'identifier'] == u'INTRODUCTION':
            # a LandingPageModule created by the resolver (default module)
            assert lpm[u'existsInDatabase'] is False
            assert lpm[u'order'] == 2.0
            assert lpm[u'enabled'] is False
            assert lpm[u'configuration'] == u'{}'

    assert orders == sorted(orders)


def test_mutation_create_landing_page_module(graphql_request):

    mutation = u""" mutation createLandingPageModule
                            (
                            $typeIdentifier: String
                            $enabled: Boolean
                            $order: Float
                            $configuration: String
                            )
                                {
                                createLandingPageModule
                                (
                                typeIdentifier: $typeIdentifier
                                enabled: $enabled
                                order: $order
                                configuration: $configuration
                                )
                                    {
                                    landingPageModule
                                        {
                                        configuration
                                        enabled
                                        moduleType
                                            {
                                            identifier
                                            title
                                            }
                                        order
                                        }
                                    }
                                }"""
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        'typeIdentifier': "HEADER",
        'enabled': True, 'order': 42.0,
        'configuration': 'Standard_configuration',
    })
    assert res.errors is None
    lpm = res.data[u'createLandingPageModule']['landingPageModule']
    assert lpm[u'configuration'] == 'Standard_configuration'
    assert lpm[u'enabled'] is True
    assert lpm[u'moduleType'][u'identifier'] == u'HEADER'
    assert lpm[u'moduleType'][u'title'] == u'Header'
    assert lpm[u'order'] == 42.0


def test_mutation_update_landing_page_module(graphql_request, simple_landing_page_module):
    mutation = u""" mutation updateLandingPageModule
                            (
                            $id: ID!
                            $enabled: Boolean
                            $order: Float
                            $configuration: String
                            )
                                {
                                updateLandingPageModule
                                (
                                id: $id
                                enabled: $enabled
                                order: $order
                                configuration: $configuration
                                )
                                    {
                                    landingPageModule
                                        {
                                        configuration
                                        enabled
                                        moduleType
                                            {
                                            identifier
                                            title
                                            }
                                        order
                                        }
                                    }
                                }"""

    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        'id': to_global_id('LandingPageModule', simple_landing_page_module.id),
        'enabled': False, 'order': 43.0,
        'configuration': 'Standard_configuration_updated',
    })
    assert res.errors is None
    lpm = res.data[u'updateLandingPageModule']['landingPageModule']
    assert lpm[u'configuration'] == 'Standard_configuration_updated'
    assert lpm[u'enabled'] is False
    assert lpm[u'order'] == 43.0
