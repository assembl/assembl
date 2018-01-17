# -*- coding: utf-8 -*-
from graphql_relay.node.node import to_global_id

from assembl.graphql.schema import Schema as schema


UPDATE_USER_MUTATION = u"""
mutation UpdateUser($id: ID!, $name: String, $username: String, $img: String, $oldPassword: String, $newPassword: String, $newPassword2: String) {
  updateUser(
    id: $id
    name: $name
    username: $username
    image: $img,
    oldPassword: $oldPassword,
    newPassword: $newPassword,
    newPassword2: $newPassword2
  ) {
    user {
      ... on AgentProfile {
        id
        name
        username
        displayName
        image { externalUrl }
      }
    }
  }
}
"""


def test_graphql_get_profile(graphql_request, participant1_user):
    res = schema.execute(u"""
query User($id: ID!) {
    user: node(id: $id) {
      ... on AgentProfile {
        id
        name
        username
        displayName
        email
        creationDate
        image { externalUrl }
      }
    }
  }
""", context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)
    })
    assert res.errors is None
    assert res.data['user']['name'] == u'A. Barking Loon'
    assert res.data['user']['username'] is None
    assert res.data['user']['displayName'] == u'A. Barking Loon'
    assert res.data['user']['email'] == u'abloon@gmail.com'
    # 2018-01-04T12:08:44.735489+00:00
    assert u'T' in res.data['user']['creationDate']
    assert res.data['user']['image'] is None


def test_graphql_get_profile_should_not_see_email(graphql_request, discussion_with_default_data, participant1_user, participant2_user):
    # participant2_user sould not see the email of participant1_user
    graphql_request.authenticated_userid = participant2_user.id
    res = schema.execute(u"""
query User($id: ID!) {
    user: node(id: $id) {
      ... on AgentProfile {
        id
        name
        username
        displayName
        email
      }
    }
  }
""", context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)
    })
    assert res.errors is None
    assert res.data['user']['name'] == u'A. Barking Loon'
    assert res.data['user']['username'] is None
    assert res.data['user']['displayName'] == u'A. Barking Loon'
    assert res.data['user']['email'] is None


def test_graphql_update_user(graphql_request, participant1_user):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    graphql_request.POST['variables.img'] = FieldStorage(
        u'path/to/new-img.png', 'image/png')

    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "name": u"M. Barking Loon",
        "username": u"Barking.Loon",
        "img": u"variables.img"
    })
    assert res.errors is None
    assert res.data['updateUser']['user']['name'] == u'M. Barking Loon'
    assert res.data['updateUser']['user']['username'] == u'Barking.Loon'
    assert res.data['updateUser']['user']['displayName'] == u'M. Barking Loon'
    image = res.data['updateUser']['user']['image']
    assert '/documents/' in image['externalUrl']

    # clean up
    participant1_user.username_p = None


def test_graphql_update_user_check_username_uniqueness(graphql_request, participant1_user, participant2_user):
    participant2_user.username_p = u"Barking.Loon"
    participant2_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "name": u"M. Barking Loon",
        "username": u"Barking.Loon",
    })
    assert res.errors is not None
    assert res.errors[0].message == u'001: We already have a user with this username.'

    # clean up
    participant2_user.username_p = None


def test_graphql_update_user_modify_password(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    old_password = participant1_user.password
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "new_secret",
        "newPassword2": "new_secret"
    })
    assert res.errors is None
    # verify there is no changes in other fields
    assert res.data['updateUser']['user']['name'] == u'A. Barking Loon'
    assert res.data['updateUser']['user']['username'] is None
    assert res.data['updateUser']['user']['displayName'] == u'A. Barking Loon'
    # verify password has changed
    new_password = participant1_user.password
    assert new_password != old_password


def test_graphql_update_user_modify_password_refused_because_not_owner(graphql_request, discussion_with_default_data, participant1_user, participant2_user):
    # participant2_user can't modify the password of participant1_user
    graphql_request.authenticated_userid = participant2_user.id
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "new_secret",
        "newPassword2": "new_secret"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"The authenticated user can't update this user"


def test_graphql_update_user_modify_password_wrong_password(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "passwrd",  # wrong password
        "newPassword": "new_secret",
        "newPassword2": "new_secret"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"002: The entered password doesn't match your current password."


def test_graphql_update_user_modify_password_passwords_mismatch(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "new_secret",
        "newPassword2": "newsecret"  # not the same password
    })
    assert res.errors is not None
    assert res.errors[0].message == u"003: You entered two different passwords."


def test_graphql_update_user_modify_password_needs_to_be_different(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"004: The new password has to be different than the current password."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_1(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password2",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_2(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password3",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_3(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password4",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_4(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.password_p = "password5"
    participant1_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password5",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_can_reuse_the_old_6th_password_set(graphql_request, participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.password_p = "password5"
    participant1_user.db.flush()
    participant1_user.password_p = "password6"
    participant1_user.db.flush()
    res = schema.execute(UPDATE_USER_MUTATION,
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password6",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is None
