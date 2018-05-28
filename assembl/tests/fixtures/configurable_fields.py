import pytest


@pytest.fixture(scope="function")
def text_field(request, test_session, discussion):
    from assembl.models import LangString, TextField
    saobj = TextField(
        discussion=discussion,
        order=1.0,
        title=LangString.create('My text field', 'en'),
        required=True
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer text_field"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj


@pytest.fixture(scope="function")
def text_field2(request, test_session, discussion):
    from assembl.models import LangString, TextField
    from assembl.models.configurable_fields import TextFieldsTypesEnum
    saobj = TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.EMAIL.value,
        order=2.0,
        title=LangString.create('My other custom text field', 'en'),
        required=False
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer text_field2"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj


@pytest.fixture(scope="function")
def fullname_text_field(request, test_session, discussion):
    from assembl.models import LangString, TextField
    from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum, TextFieldsTypesEnum
    saobj = TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.EMAIL.value,
        identifier=ConfigurableFieldIdentifiersEnum.FULLNAME.value,
        order=2.0,
        title=LangString.create('My fullname text field', 'en'),
        required=False
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer fullname_text_field"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj


@pytest.fixture(scope="function")
def select_field(request, test_session, discussion):
    from assembl.models import LangString, SelectField
    saobj = SelectField(
        discussion=discussion,
        order=1.0,
        title=LangString.create('My select field', 'en'),
        required=True,
        options=[]
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer select_field"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj


@pytest.fixture(scope="function")
def profile_field(request, test_session, admin_user, text_field, discussion):
    from assembl.models import ProfileField
    saobj = ProfileField(
        discussion=discussion,
        agent_profile=admin_user,
        configurable_field=text_field,
        value_data={
            u'value': u'Shayna_Howe@gmail.com'
        }
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer profile_field"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj


@pytest.fixture(scope="function")
def profile_field_for_participant_user(request, test_session, participant1_user, text_field, discussion):
    from assembl.models import ProfileField
    saobj = ProfileField(discussion=discussion, agent_profile=participant1_user, configurable_field=text_field, value_data={
        u'value': u'first_text_field@gmail.com'
    })

    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer profile fields for participant1_user"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj
