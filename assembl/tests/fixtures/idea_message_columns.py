import pytest


@pytest.fixture(scope="function")
def idea_message_column_positive(request, test_adminuser_webrequest, subidea_1, test_session):
    from assembl.models import IdeaMessageColumn, LangString

    column = IdeaMessageColumn(idea=subidea_1,
                               message_classifier='positive',
                               name=LangString.create('Say my name', 'en'),
                               title=LangString.create('Add your point of view in favor of the theme', 'en'),
                               color="green")

    test_session.add(column)
    synthesis = column.create_column_synthesis(
        subject=LangString.create('Be positive!', 'en'),
        body=LangString.create('This is a positive header', 'en'),
        creator_id=test_adminuser_webrequest.authenticated_userid
    )
    test_session.flush()

    def fin():
        test_session.delete(synthesis.idea_links_of_content[0])
        test_session.delete(synthesis)
        test_session.delete(column)
        test_session.flush()

    request.addfinalizer(fin)
    return column


@pytest.fixture(scope="function")
def idea_message_column_negative(request, test_adminuser_webrequest, subidea_1,
                                 idea_message_column_positive, test_session):
    from assembl.models import IdeaMessageColumn, LangString

    column = IdeaMessageColumn(idea=subidea_1,
                               message_classifier='negative',
                               name=LangString.create('My other name', 'en'),
                               title=LangString.create('Add your point of view against the theme', 'en'),
                               color="red",
                               previous_column=idea_message_column_positive)

    test_session.add(column)
    synthesis = column.create_column_synthesis(
        subject=LangString.create('Be negative!', 'en'),
        body=LangString.create('This is a negative header', 'en'),
        creator_id=test_adminuser_webrequest.authenticated_userid
    )
    test_session.flush()

    def fin():
        test_session.delete(synthesis)
        test_session.delete(synthesis.idea_links_of_content[0])
        test_session.delete(column)
        test_session.flush()

    request.addfinalizer(fin)
    return column


@pytest.fixture(scope="function")
def idea_message_column_positive_on_subidea_1_1(request, test_adminuser_webrequest, subidea_1_1, test_session):
    from assembl.models import IdeaMessageColumn, LangString

    column = IdeaMessageColumn(idea=subidea_1_1,
                               message_classifier='positive',
                               name=LangString.create('Say my name', 'en'),
                               title=LangString.create('Add your point of view in favor of the theme', 'en'),
                               color="green")

    test_session.add(column)
    synthesis = column.create_column_synthesis(
        subject=LangString.create('Be positive!', 'en'),
        body=LangString.create('This is a positive header', 'en'),
        creator_id=test_adminuser_webrequest.authenticated_userid
    )
    test_session.flush()

    def fin():
        test_session.delete(synthesis)
        test_session.delete(synthesis.idea_links_of_content[0])
        test_session.delete(column)
        test_session.flush()

    request.addfinalizer(fin)
    return column


@pytest.fixture(scope="function")
def idea_message_column_negative_on_subidea_1_1(request, test_adminuser_webrequest, subidea_1_1, test_session):
    from assembl.models import IdeaMessageColumn, LangString

    column = IdeaMessageColumn(idea=subidea_1_1,
                               message_classifier='negative',
                               name=LangString.create('Say my name', 'en'),
                               title=LangString.create('Add your point of view against the theme', 'en'),
                               color="red")

    test_session.add(column)
    synthesis = column.create_column_synthesis(
        subject=LangString.create('Be negative!', 'en'),
        body=LangString.create('This is a negative header', 'en'),
        creator_id=test_adminuser_webrequest.authenticated_userid
    )
    test_session.flush()

    def fin():
        test_session.delete(synthesis)
        test_session.delete(synthesis.idea_links_of_content[0])
        test_session.delete(column)
        test_session.flush()

    request.addfinalizer(fin)
    return column
