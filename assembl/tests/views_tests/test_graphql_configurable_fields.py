# -*- coding=utf-8 -*-
from graphql_relay.node.node import from_global_id, to_global_id

from assembl.graphql.schema import Schema as schema


def test_query_text_fields(graphql_request, graphql_registry, text_field):
    from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum, TextFieldsTypesEnum
    res = schema.execute(
        graphql_registry['TextFields'],
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['textFields']) == 1

    tf = res.data['textFields'][0]
    assert tf['fieldType'] == TextFieldsTypesEnum.TEXT.value
    assert tf['identifier'] == ConfigurableFieldIdentifiersEnum.CUSTOM.value
    assert tf['title'] == u'My text field'
    assert tf['titleEntries'][0]['localeCode'] == u'en'
    assert tf['titleEntries'][0]['value'] == u'My text field'
    assert tf['order'] == 1.0
    assert tf['required'] is True


def test_mutation_create_text_field(graphql_request, graphql_registry, test_session):
    from assembl.models.configurable_fields import TextField
    res = schema.execute(
        graphql_registry['createTextField'],
        context_value=graphql_request,
        variable_values={
            "lang": u"en",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new field" }
            ],
            "order": 4.0,
            "required": False
        })
    assert res.errors is None
    assert 'createTextField' in res.data
    new_field = res.data['createTextField']['textField']
    assert new_field[u'required'] is False
    assert new_field[u'order'] == 4.0
    title_entries = new_field['titleEntries']
    assert title_entries[0]['localeCode'] == u'en'
    assert title_entries[0]['value'] == u'My new field'
    saobj = TextField.get(from_global_id(new_field[u'id'])[1])
    test_session.delete(saobj)


def test_mutation_update_text_field(graphql_request, graphql_registry, text_field):
    text_field_id = to_global_id('TextField', text_field.id)
    res = schema.execute(
        graphql_registry['updateTextField'],
        context_value=graphql_request,
        variable_values={
            "id": text_field_id,
            "lang": u"en",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new title" },
                { "localeCode": "be", "value": u"Mon nouveau titre" },
            ],
            "order": 8.0,
            "required": False
        })
    assert res.errors is None
    assert 'updateTextField' in res.data
    field = res.data['updateTextField']['textField']
    assert field[u'required'] is False
    assert field[u'order'] == 8.0
    title_entries = field['titleEntries']
    assert title_entries[0]['localeCode'] == u'be'
    assert title_entries[0]['value'] == u'Mon nouveau titre'
    assert title_entries[1]['localeCode'] == u'en'
    assert title_entries[1]['value'] == u'My new title'


def test_mutation_delete_text_field(graphql_request, text_field, graphql_registry):
    mutation = graphql_registry['deleteTextField']
    text_field_id = to_global_id("TextField", text_field.id)
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "id": text_field_id
    })
    assert res.errors is None
    assert res.data['deleteTextField']['success'] is True


def test_query_profile_fields(graphql_request, graphql_registry, text_field, profile_field):
    import json
    from assembl.models.configurable_fields import TextFieldsTypesEnum
    res = schema.execute(
        graphql_registry['ProfileFields'],
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['profileFields']) == 2

    generated_tf = res.data['profileFields'][0]
    assert int(from_global_id(generated_tf['id'])[1]) < 0
    assert generated_tf['configurableField']['fieldType'] == TextFieldsTypesEnum.TEXT.value
    assert generated_tf['configurableField']['title'] == u'My text field'
    assert generated_tf['configurableField']['order'] == 1.0
    assert generated_tf['configurableField']['required'] is True
    assert generated_tf['valueData'][u'value'] is None

    tf_with_value = res.data['profileFields'][1]
    assert int(from_global_id(tf_with_value['id'])[1]) == profile_field.id
    assert tf_with_value['configurableField']['title'] == u'My other text field'
    assert tf_with_value['configurableField']['fieldType'] == TextFieldsTypesEnum.EMAIL.value
    assert tf_with_value['configurableField']['order'] == 2.0
    assert tf_with_value['configurableField']['required'] is False
    assert tf_with_value['valueData'][u'value'] == u'Shayna_Howe@gmail.com'


def test_mutation_create_profile_field(graphql_request, graphql_registry, text_field, test_session):
    from assembl.models.configurable_fields import ProfileField
    profile_field_id = to_global_id('ProfileField', '-18982938')
    configurable_field_id = to_global_id('TextField', text_field.id)
    res = schema.execute(
        graphql_registry['updateProfileField'],
        context_value=graphql_request,
        variable_values={
            u"configurableFieldId": configurable_field_id,
            u"id": profile_field_id,
            u"valueData": {
                u"value": u"New value"
            }
        })
    assert res.errors is None
    assert 'updateProfileField' in res.data
    pf = res.data[u'updateProfileField'][u'profileField']
    assert pf[u'valueData'] == { u'value': u'New value' }
    saobj = ProfileField.get(from_global_id(pf[u'id'])[1])
    test_session.delete(saobj)


def test_mutation_update_profile_field(graphql_request, graphql_registry, profile_field):
    profile_field_id = to_global_id('ProfileField', profile_field.id)
    configurable_field_id = to_global_id('TextField', profile_field.configurable_field.id)
    res = schema.execute(
        graphql_registry['updateProfileField'],
        context_value=graphql_request,
        variable_values={
            u"configurableFieldId": configurable_field_id,
            u"id": profile_field_id,
            u"valueData": {
                u"value": u"New value"
            }
        })
    assert res.errors is None
    assert 'updateProfileField' in res.data
    pf = res.data[u'updateProfileField'][u'profileField']
    assert pf[u'id'] == profile_field_id
    assert pf[u'valueData'] == { u'value': u'New value' }
