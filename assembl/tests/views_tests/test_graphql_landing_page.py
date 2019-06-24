from graphql_relay.node.node import to_global_id

from assembl.graphql.schema import Schema as schema
from assembl.tests.model_tests.test_landing_page import MODULES_COUNT


def test_query_landing_page_module_types(graphql_request, graphql_registry):
    res = schema.execute(
        graphql_registry['LandingPageModuleTypesQuery'],
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['landingPageModuleTypes']) == MODULES_COUNT
    for module_type in res.data['landingPageModuleTypes']:
        if module_type['identifier'] == 'INTRODUCTION':
            assert module_type['title'] == u'Text & Multimedia'
            assert module_type['defaultOrder'] == 2.0
            assert module_type['editableOrder'] is True
            assert module_type['required'] is False


def test_query_landing_page_modules(graphql_request, graphql_registry, simple_landing_page_module,
                                    footer_landing_page_module):
    res = schema.execute(
        graphql_registry['LandingPageModulesQuery'],
        context_value=graphql_request,
        variable_values={"lang": u"en"})

    assert len(res.data[u'landingPageModules']) == MODULES_COUNT
    orders = []
    modules = res.data[u'landingPageModules']
    assert modules[0]['moduleType']['identifier'] == 'HEADER'  # header is top
    for lpm in modules:
        if lpm[u'moduleType'][u'identifier'] == u'HEADER':
            # the LandingPageModule we created before
            assert lpm[u'existsInDatabase'] is True
            assert lpm[u'order'] == 42.0
            assert lpm[u'enabled'] is True
            assert lpm[u'title'] is None
            assert lpm[u'subtitle'] is None
            assert lpm[u'configuration'] == u'{text:"The SDD feed is down, override the optical system so we can connect the SAS bus!"}'
            assert lpm[u'moduleType'][u'title'] == u'Header'
            assert lpm[u'moduleType'][u'defaultOrder'] == 1.0
            assert lpm[u'moduleType'][u'editableOrder'] is False
            assert lpm[u'moduleType'][u'required'] is True
        elif lpm[u'moduleType'][u'identifier'] == u'INTRODUCTION':
            orders.append(lpm['order'])
            # a LandingPageModule created by the resolver (default module)
            assert lpm[u'existsInDatabase'] is False
            assert lpm[u'order'] == 2.0
            assert lpm[u'enabled'] is False
            assert lpm[u'configuration'] == u'{}'

    assert orders == sorted(orders)


def test_mutation_create_landing_page_module(graphql_request, graphql_registry):
    res = schema.execute(graphql_registry['createLandingPageModule'],
                         context_value=graphql_request,
                         variable_values={
                             'typeIdentifier': "HEADER",
                             'enabled': True, 'order': 42.0,
                             'configuration': 'Standard_configuration',
                         }, )
    assert res.errors is None
    lpm = res.data[u'createLandingPageModule']['landingPageModule']
    assert lpm[u'configuration'] == 'Standard_configuration'
    assert lpm[u'enabled'] is True
    assert lpm[u'moduleType'][u'identifier'] == u'HEADER'
    assert lpm[u'moduleType'][u'title'] == u'Header'
    assert lpm[u'order'] == 42.0


def test_mutation_update_landing_page_module(graphql_request, graphql_registry, simple_landing_page_module):
    res = schema.execute(graphql_registry['updateLandingPageModule'],
                         context_value=graphql_request, variable_values={
        'id': to_global_id('LandingPageModule', simple_landing_page_module.id),
        'enabled': False, 'order': 43.0,
        'configuration': 'Standard_configuration_updated',
        'titleEntries': [
          {'value': "New section", 'localeCode': "en"}
        ],
        'subtitleEntries': [
          {'value': "New section with subtitle", 'localeCode': "en"}
        ]
    })
    assert res.errors is None
    lpm = res.data[u'updateLandingPageModule']['landingPageModule']
    assert lpm[u'configuration'] == 'Standard_configuration_updated'
    assert lpm[u'enabled'] is False
    assert lpm[u'order'] == 43.0
    assert lpm[u'titleEntries'] == [
        {'value': "New section", 'localeCode': "en"}
    ]
    assert lpm[u'subtitleEntries'] == [
        {'value': "New section with subtitle", 'localeCode': "en"}
    ]


def test_mutation_delete_landing_page_module(graphql_request, graphql_registry, simple_landing_page_module):
    from assembl.models import LandingPageModule
    assert LandingPageModule.get(simple_landing_page_module.id) is not None
    res = schema.execute(graphql_registry['deleteLandingPageModule'],
                         context_value=graphql_request,
                         variable_values={
                             'id': to_global_id('LandingPageModule', simple_landing_page_module.id)
                         })
    assert res.errors is None
    assert LandingPageModule.get(simple_landing_page_module.id) is None


def test_graphql_get_multilingual_landing_page_module(graphql_request, graphql_registry,
                                                      text_and_multimedia_landing_page_module):
    res = schema.execute(
        graphql_registry['MultilingualLandingPageModuleQuery'],
        context_value=graphql_request,
        variable_values={
            'id': to_global_id('LandingPageModule', text_and_multimedia_landing_page_module.id),
            'lang': 'fr',
        }
    )
    assert res.errors is None
    discussion = res.data['landingPageModule']
    assert (not res.errors), res.errors
    assert discussion['titleEntries'][0]['value'] == 'Multimedia title EN'
    assert discussion['bodyEntries'][0]['value'] == 'Multimedia body EN'
