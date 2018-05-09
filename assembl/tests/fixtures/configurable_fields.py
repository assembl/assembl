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
        title=LangString.create('My other text field', 'en'),
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
def profile_text_field(request, test_session, admin_user, text_field2, discussion):
    from assembl.models import ProfileTextField
    saobj = ProfileTextField(
        discussion=discussion,
        agent_profile=admin_user,
        text_field=text_field2,
        value=u'Shayna_Howe@gmail.com'
    )
    test_session.add(saobj)
    test_session.flush()

    def fin():
        print "Finalizer profile_text_field"
        test_session.delete(saobj)
        test_session.flush()

    request.addfinalizer(fin)
    return saobj
