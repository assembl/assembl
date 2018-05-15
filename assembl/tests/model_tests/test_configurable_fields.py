# -*- coding=utf-8 -*-
from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum, TextField, TextFieldsTypesEnum, ProfileField


def test_create_text_field(test_session, admin_user, discussion):
    from assembl.models import LangString
    text_field = TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.TEXT.value,
        identifier=ConfigurableFieldIdentifiersEnum.FULLNAME.value,
        order=1.0,
        title=LangString.create('Fullname', 'en'),
        required=True,
    )
    test_session.add(text_field)
    test_session.flush()
    assert text_field.field_type == TextFieldsTypesEnum.TEXT.value
    assert text_field.title.entries[0].locale_code == 'en'
    assert text_field.title.entries[0].value == 'Fullname'
    assert text_field.order == 1.0
    assert text_field.required
    test_session.delete(text_field)


def test_create_profile_field(test_session, discussion, participant1_user, text_field):
    profile_field = ProfileField(
        discussion=discussion,
        agent_profile=participant1_user,
        configurable_field=text_field,
    )
    test_session.add(profile_field)
    test_session.flush()
    assert profile_field.discussion_id == discussion.id
    assert profile_field.configurable_field_id == text_field.id
    assert profile_field.agent_profile_id == participant1_user.id
    assert profile_field.value_data is None
    test_session.delete(profile_field)
