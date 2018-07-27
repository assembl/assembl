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
    assert tf['hidden'] is False

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
            "required": False,
            "hidden": False
        })
    assert res.errors is None
    assert 'createTextField' in res.data
    new_field = res.data['createTextField']['field']
    assert new_field[u'required'] is False
    assert new_field[u'hidden'] is False
    assert new_field[u'order'] == 4.0
    title_entries = new_field['titleEntries']
    assert title_entries[0]['localeCode'] == u'en'
    assert title_entries[0]['value'] == u'My new field'
    saobj = TextField.get(from_global_id(new_field[u'id'])[1])
    test_session.delete(saobj)


def test_mutation_create_select_field(graphql_request, graphql_registry, test_session):
    from assembl.models.configurable_fields import SelectField
    res = schema.execute(
        graphql_registry['createTextField'],
        context_value=graphql_request,
        variable_values={
            "lang": u"en",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new field" }
            ],
            "order": 4.0,
            "required": False,
            "hidden": False,
            "options": [
                {"labelEntries": [
                    {"value": u"Option un", "localeCode": "fr"},
                    {"value": u"Option one", "localeCode": "en"}
                 ],
                 "order": 1.0,
                },
                {"labelEntries": [
                    {"value": u"Option deux", "localeCode": "fr"},
                    {"value": u"Option two", "localeCode": "en"}
                 ],
                 "order": 2.0,
                }
            ]
        })
    assert res.errors is None
    assert 'createTextField' in res.data
    new_field = res.data['createTextField']['field']
    assert new_field[u'required'] is False
    assert new_field[u'hidden'] is False
    assert new_field[u'order'] == 4.0
    assert len(new_field[u'options']) == 2
    assert new_field[u'options'][0]['label'] == u'Option one'
    assert new_field[u'options'][1]['label'] == u'Option two'
    title_entries = new_field['titleEntries']
    assert title_entries[0]['localeCode'] == u'en'
    assert title_entries[0]['value'] == u'My new field'
    saobj = SelectField.get(from_global_id(new_field[u'id'])[1])
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
            "required": False,
            "hidden": False
        })
    assert res.errors is None
    assert 'updateTextField' in res.data
    field = res.data['updateTextField']['field']
    assert field[u'required'] is False
    assert field[u'hidden'] is False
    assert field[u'order'] == 8.0
    title_entries = field['titleEntries']
    assert title_entries[0]['localeCode'] == u'be'
    assert title_entries[0]['value'] == u'Mon nouveau titre'
    assert title_entries[1]['localeCode'] == u'en'
    assert title_entries[1]['value'] == u'My new title'


def test_mutation_update_select_field(graphql_request, graphql_registry, select_field):
    field_id = to_global_id('SelectField', select_field.id)
    res = schema.execute(
        graphql_registry['updateTextField'],
        context_value=graphql_request,
        variable_values={
            "id": field_id,
            "lang": u"en",
            "titleEntries": [
                { "localeCode": "en", "value": u"My new title" },
                { "localeCode": "be", "value": u"Mon nouveau titre" },
            ],
            "order": 8.0,
            "required": False,
            "hidden": False,
            "options": [
                {"labelEntries": [
                    {"value": u"Option un", "localeCode": "fr"},
                    {"value": u"Option one", "localeCode": "en"}
                 ],
                 "order": 1.0,
                },
                {"labelEntries": [
                    {"value": u"Option deux", "localeCode": "fr"},
                    {"value": u"Option two", "localeCode": "en"}
                 ],
                 "order": 2.0,
                }
            ]
        })
    assert res.errors is None
    assert 'updateTextField' in res.data
    field = res.data['updateTextField']['field']
    assert field[u'required'] is False
    assert field[u'hidden'] is False
    assert field[u'order'] == 8.0
    assert len(field[u'options']) == 2
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


def test_mutation_delete_select_field(graphql_request, select_field, graphql_registry):
    mutation = graphql_registry['deleteTextField']
    text_field_id = to_global_id("SelectField", select_field.id)
    res = schema.execute(mutation, context_value=graphql_request, variable_values={
        "id": text_field_id
    })
    assert res.errors is None
    assert res.data['deleteTextField']['success'] is True


def test_query_profile_fields(graphql_request, graphql_registry, text_field2, profile_field):
    from assembl.models.configurable_fields import TextFieldsTypesEnum
    res = schema.execute(
        graphql_registry['ProfileFields'],
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['profileFields']) == 2

    tf_with_value = res.data['profileFields'][0]
    assert int(from_global_id(tf_with_value['id'])[1]) == profile_field.id
    assert tf_with_value['configurableField']['title'] == u'My text field'
    assert tf_with_value['configurableField']['fieldType'] == TextFieldsTypesEnum.TEXT.value
    assert tf_with_value['configurableField']['order'] == 1.0
    assert tf_with_value['configurableField']['required'] is True
    assert tf_with_value['configurableField']['hidden'] is False
    assert tf_with_value['valueData'][u'value'] == u'Shayna_Howe@gmail.com'

    generated_tf = res.data['profileFields'][1]
    assert int(from_global_id(generated_tf['id'])[1]) < 0
    assert generated_tf['configurableField']['fieldType'] == TextFieldsTypesEnum.EMAIL.value
    assert generated_tf['configurableField']['title'] == u'My other custom text field'
    assert generated_tf['configurableField']['order'] == 2.0
    assert generated_tf['configurableField']['required'] is False
    assert generated_tf['configurableField']['hidden'] is False
    assert generated_tf['valueData'][u'value'] is None


def test_mutation_update_profile_fields(admin_user, graphql_request, graphql_registry, text_field2, profile_field, fullname_text_field):
    fullname_configurable_field_id = to_global_id('TextField', fullname_text_field.id)
    profile_field_id = to_global_id('ProfileField', profile_field.id)
    configurable_field_id = to_global_id('TextField', profile_field.configurable_field.id)
    text_field2_id = to_global_id('TextField', text_field2.id)
    data = [
        # create custom field
        {
            u"configurableFieldId": text_field2_id,
            u"id": to_global_id('ProfileField', -664453),
            u"valueData": {
                u"value": u"Creative Saint Kitts and Nevis time-frame"
            }
        },
        # update custom field
        {
            u"configurableFieldId": configurable_field_id,
            u"id": profile_field_id,
            u"valueData": {
                u"value": u"New value"
            }
        },
        # non custom field:
        {
            u"configurableFieldId": fullname_configurable_field_id,
            u"id": to_global_id('ProfileField', -8278763),
            u"valueData": {
                u"value": u"Chad D'Amore"
            }
        }
    ]
    res = schema.execute(
        graphql_registry['updateProfileFields'],
        context_value=graphql_request,
        variable_values={
            u'data': data,
            u'lang': u"en"
        }
    )
    assert res.errors is None
    assert 'updateProfileFields' in res.data
    fields = res.data[u'updateProfileFields'][u'profileFields']
    assert len(fields) == 2
    assert fields[0][u'id'] == profile_field_id
    assert fields[0][u'valueData'][u'value'] == u'New value'
    assert fields[1][u'configurableField'][u'id'] == text_field2_id
    assert fields[1][u'valueData'][u'value'] == u'Creative Saint Kitts and Nevis time-frame'
    assert admin_user.real_name() == u"Chad D'Amore"
