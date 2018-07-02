# -*- coding: utf-8 -*-
from graphql_relay.node.node import to_global_id

from assembl.graphql.schema import Schema as schema
from assembl.tests.utils import give_user_role

DELETE_USER_INFORMATION_MUTATION = u"""
mutation deleteUserInformation($id: ID!) {
    deleteUserInformation(
    id: $id
  ) {
    user{
    ... on AgentProfile {
      id
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
        hasPassword
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
    assert res.data['user']['hasPassword']


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


def test_graphql_update_user(graphql_request, participant1_user, graphql_registry):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    graphql_request.POST['variables.img'] = FieldStorage(
        u'path/to/new-img.png', 'image/png')

    user_id = to_global_id('AgentProfile', participant1_user.id)
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": user_id,
        "name": u"M. Barking Loon",
        "username": u"Barking.Loon",
        "img": u"variables.img"
    })
    assert res.errors is None
    assert res.data['updateUser']['user']['name'] == u'M. Barking Loon'
    assert res.data['updateUser']['user']['username'] == u'Barking.Loon'
    assert res.data['updateUser']['user']['displayName'] == u'Barking.Loon'
    image = res.data['updateUser']['user']['image']
    assert '/documents/' in image['externalUrl']

    # update only the user name
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": user_id,
        "name": u"M. Barking Moon"
    })
    assert res.errors is None
    assert res.data['updateUser']['user']['name'] == u'M. Barking Moon'
    assert res.data['updateUser']['user']['username'] == u'Barking.Loon'
    assert res.data['updateUser']['user']['displayName'] == u'Barking.Loon'
    image = res.data['updateUser']['user']['image']
    assert '/documents/' in image['externalUrl']

    # clean up
    participant1_user.username_p = None


def test_graphql_update_user_check_username_uniqueness(graphql_request, participant1_user, participant2_user, graphql_registry):
    participant2_user.username_p = u"Barking.Loon"
    participant2_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "name": u"M. Barking Loon",
        "username": u"Barking.Loon",
    })
    assert res.errors is not None
    assert res.errors[0].message == u'001: We already have a user with this username.'

    # clean up
    participant2_user.username_p = None


def test_graphql_update_user_modify_password(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    old_password = participant1_user.password
    res = schema.execute(graphql_registry["updateUser"],
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


def test_graphql_update_user_modify_password_refused_because_not_owner(graphql_request, discussion_with_default_data, participant1_user, participant2_user,
                                                                       graphql_registry):
    # participant2_user can't modify the password of participant1_user
    graphql_request.authenticated_userid = participant2_user.id
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "new_secret",
        "newPassword2": "new_secret"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"You don't have the authorization to update this user. If you think it's an error, please reconnect to assembl."


def test_graphql_update_user_modify_password_wrong_password(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "passwrd",  # wrong password
        "newPassword": "new_secret",
        "newPassword2": "new_secret"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"002: The entered password doesn't match your current password."


def test_graphql_update_user_modify_password_passwords_mismatch(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "new_secret",
        "newPassword2": "newsecret"  # not the same password
    })
    assert res.errors is not None
    assert res.errors[0].message == u"003: You entered two different passwords."


def test_graphql_update_user_modify_password_needs_to_be_different(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"004: The new password has to be different than the current password."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_1(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password2",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_2(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password3",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_3(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password4",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_needs_to_be_different_from_previous_5_passwords_4(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.password_p = "password5"
    participant1_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id),
        "oldPassword": "password5",
        "newPassword": "password",
        "newPassword2": "password"
    })
    assert res.errors is not None
    assert res.errors[0].message == u"005: The new password has to be different than the last 5 passwords you set."


def test_graphql_update_user_modify_password_can_reuse_the_old_6th_password_set(graphql_request, participant1_user, graphql_registry):
    graphql_request.authenticated_userid = participant1_user.id
    participant1_user.password_p = "password2"
    participant1_user.password_p = "password3"
    participant1_user.password_p = "password4"
    participant1_user.password_p = "password5"
    participant1_user.db.flush()
    participant1_user.password_p = "password6"
    participant1_user.db.flush()
    res = schema.execute(graphql_registry["updateUser"],
                         context_value=graphql_request, variable_values={
                             "id": to_global_id('AgentProfile', participant1_user.id),
                             "oldPassword": "password6",
                             "newPassword": "password",
                             "newPassword2": "password"
                         })
    assert res.errors is None


def test_graphql_delete_user_information(participant1_user, graphql_request):
    from assembl.auth.password import random_string
    user_password = participant1_user.password
    user_username = participant1_user.username_p
    user_preferred_email = participant1_user.preferred_email
    user_last_assembl_login = participant1_user.last_assembl_login
    user_name = participant1_user.name
    user_old_passwords = participant1_user.old_passwords
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)
    })
    assert res.errors is None
    assert participant1_user.is_deleted is True
    assert participant1_user.password != user_password
    assert participant1_user.preferred_email != user_preferred_email
    assert participant1_user.last_assembl_login != user_last_assembl_login
    assert participant1_user.name != user_name
    for p in participant1_user.old_passwords:
        for pa in user_old_passwords:
            assert pa != p.password


def test_graphql_delete_sysadmin_user(discussion_sysadmin_user, graphql_request):
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', discussion_sysadmin_user.id)
    })
    assert res.errors is not None
    assert res.errors[0].message == u"Can't delete a user with sysadmin rights."


def test_graphql_delete_admin_user_alone(discussion_admin_user, graphql_request):
    """
    Testing if it is possible to delete an admin user
    if he is the only admin user
    """
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', discussion_admin_user.id)
    })
    assert res.errors is not None
    assert res.errors[0].message == u"User can't delete his account because this is the only admin account"


def test_graphql_delete_admin_user_not_alone(discussion_admin_user, discussion_admin_user_2, graphql_request):
    """
    Testing if is possible to delete an admin user when he is not the only admin
    """
    from assembl.auth.password import random_string
    user_password = discussion_admin_user.password
    user_username = discussion_admin_user.username_p
    user_preferred_email = discussion_admin_user.preferred_email
    user_last_assembl_login = discussion_admin_user.last_assembl_login
    user_name = discussion_admin_user.name
    user_old_passwords = discussion_admin_user.old_passwords
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', discussion_admin_user.id)
    })

    assert res.errors is None
    assert discussion_admin_user.is_deleted is True
    assert discussion_admin_user.password != user_password
    assert discussion_admin_user.preferred_email != user_preferred_email
    assert discussion_admin_user.last_assembl_login != user_last_assembl_login
    assert discussion_admin_user.name != user_name
    for p in discussion_admin_user.old_passwords:
        for pa in user_old_passwords:
            assert pa != p.password


def test_graphql_delete_user_with_social_account(graphql_request, participant1_user, participant1_social_account):
    """
    Testing deletion of user social Accounts
    """
    social_account_username = participant1_user.social_accounts[0].username
    social_account_provider_domain = participant1_user.social_accounts[0].provider_domain
    social_account_picture_url = participant1_user.social_accounts[0].picture_url
    social_account_last_checked = participant1_user.social_accounts[0].last_checked
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)
    })
    assert res.errors is None
    assert len(participant1_user.social_accounts) == 0


def test_graphql_delete_user_with_configurable_fields(graphql_request, participant1_user, profile_field_for_participant_user, test_session):
    """
    Testing deletion of user with extra configurable text fields
    """
    from assembl import models as m
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)
    })
    assert res.errors is None
    extra_fields = test_session.query(m.ProfileField).filter(m.ProfileField.agent_profile_id == participant1_user.id).all()
    assert len(extra_fields) == 0


def test_graphql_delete_user_with_username(graphql_request, participant1_user, test_session, participant1_username):
    """Testing to delete the username for participant1_user"""
    from assembl import models as m
    username = test_session.query(m.Username).filter(m.Username.user_id == participant1_user.id).first()
    assert username.username == "Test.Username"
    res = schema.execute(DELETE_USER_INFORMATION_MUTATION, context_value=graphql_request, variable_values={
        "id": to_global_id('AgentProfile', participant1_user.id)})
    assert res.errors is None
    username = test_session.query(m.Username).filter(m.Username.user_id == participant1_user.id).all()
    assert len(username) == 0


def test_graphql_update_accepted_cookies_by_user(graphql_request, participant2_user, discussion_with_default_data, agent_status_in_discussion_3, test_session,
                                                 graphql_registry):
    from assembl import models as m
    graphql_request.authenticated_userid = participant2_user.id
    # Create a role for the non-admin user to have permissions on the discussion
    resp = None
    with give_user_role(participant2_user, discussion_with_default_data):
        resp = schema.execute(graphql_registry["updateAcceptedCookies"], context_value=graphql_request, variable_values={
            "actions": ["ACCEPT_TRACKING_ON_DISCUSSION"]
        })
    assert resp.errors is None
    assert "ACCEPT_TRACKING_ON_DISCUSSION" in agent_status_in_discussion_3.accepted_cookies
    atod = test_session.query(m.ActionOnDiscussion).filter(m.ActionOnDiscussion.type == "discussion:tracking:accept").first()
    assert atod.actor_id == participant2_user.id
    assert atod.discussion_id == discussion_with_default_data.id


def test_graphql_delete_accepted_cookie_by_user(graphql_request, participant2_user, discussion_with_default_data, agent_status_in_discussion_3, test_session,
                                                graphql_registry):
    graphql_request.authenticated_userid = participant2_user.id
    # Create a role for the non-admin user to have permissions on the discussion
    resp = None
    with give_user_role(participant2_user, discussion_with_default_data):
        resp = schema.execute(graphql_registry["updateAcceptedCookies"], context_value=graphql_request, variable_values={
            "actions": ["REJECT_CGU"]
        })
    assert resp.errors is None
    assert "ACCEPT_CGU" not in agent_status_in_discussion_3.accepted_cookies
    assert "REJECT_CGU" in agent_status_in_discussion_3.accepted_cookies


def test_graphq_query_accepted_cookie_by_user(graphql_request, participant2_user, agent_status_in_discussion_4, test_session, graphql_registry):
    from assembl.models.cookie_types import CookieTypes
    resp = schema.execute(graphql_registry["acceptedCookiesQuery"], context_value=graphql_request, variable_values={
        "id": to_global_id("AgentProfile", participant2_user.id)
    })
    assert resp.errors is None
    cookies_data = resp.data['user']['acceptedCookies']
    assert CookieTypes.ACCEPT_CGU.value in cookies_data and CookieTypes.ACCEPT_SESSION_ON_DISCUSSION.value in cookies_data
