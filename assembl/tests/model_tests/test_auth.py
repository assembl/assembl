# -*- coding: utf-8 -*-
from datetime import datetime

from assembl.models.notification import (
    ModelEventWatcherNotificationSubscriptionDispatcher)
from assembl.models.auth import TextField, ProfileTextField

def test_subscribe_to_discussion(
        test_session, discussion, participant2_user):
    test_session.flush()
    #Removing the following assert makes the test pass.  Obviously it has the side
    # effect that the nest time we use it, the data in the relationship is stale
    assert discussion not in participant2_user.participant_in_discussion, "The user should not already be subscribed to the discussion for this test"
    participant2_user.subscribe(discussion)
    test_session.flush()
    test_session.refresh(participant2_user)
    assert discussion in participant2_user.participant_in_discussion, "The user should now be subscribed to the discussion"
    participant2_user.unsubscribe(discussion)
    test_session.flush()
    assert discussion in participant2_user.participant_in_discussion, "The user should no longer be subscribed to the discussion"


def test_general_expiry(
        test_session, participant1_user, participant1_social_account, discussion):
    long_ago = datetime(2000, 1, 1)
    now = datetime.utcnow()
    # if all logins are old, our login is expired
    participant1_user.last_assembl_login = long_ago
    participant1_social_account.last_checked = long_ago
    assert participant1_user.login_expired(discussion)
    # if either social or assembl login is recent, our login is valid
    participant1_user.last_assembl_login = now
    assert not participant1_user.login_expired(discussion)
    participant1_user.last_assembl_login = long_ago
    participant1_social_account.last_checked = now
    assert not participant1_user.login_expired(discussion)


def test_restricted_discussion_expiry(
        test_session, participant1_user, participant1_social_account,
        closed_discussion):
    long_ago = datetime(2000, 1, 1)
    now = datetime.utcnow()
    # if our logins are old, our login is still expired
    participant1_user.last_assembl_login = long_ago
    participant1_social_account.last_checked = long_ago
    assert participant1_user.login_expired(closed_discussion)
    # if our last login was through assembl, no change
    participant1_user.last_assembl_login = now
    assert participant1_user.login_expired(closed_discussion)
    # only appropriate social login counts
    participant1_user.last_assembl_login = long_ago
    participant1_social_account.last_checked = now
    assert not participant1_user.login_expired(closed_discussion)


def test_restricted_discussion_expiry_override(
        test_session, admin_user, admin_social_account, closed_discussion):
    long_ago = datetime(2000, 1, 1)
    now = datetime.utcnow()
    # if our logins are old, our login is still expired
    admin_user.last_assembl_login = long_ago
    admin_social_account.last_checked = long_ago
    assert admin_user.login_expired(closed_discussion)
    # if our last login was through assembl, works because override
    admin_user.last_assembl_login = now
    assert not admin_user.login_expired(closed_discussion)
    # appropriate social login still counts
    admin_user.last_assembl_login = long_ago
    admin_social_account.last_checked = now
    assert not admin_user.login_expired(closed_discussion)


def test_create_text_field(test_session, admin_user, discussion):
    from assembl.models import LangString
    from assembl.models.auth import TextFieldsTypesEnum
    text_field = TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.TEXT.value,
        order=1.0,
        title=LangString.create('Firstname', 'en'),
        required=True,
    )
    test_session.add(text_field)
    test_session.flush()
    assert text_field.field_type == TextFieldsTypesEnum.TEXT.value
    assert text_field.title.entries[0].locale_code == 'en'
    assert text_field.title.entries[0].value == 'Firstname'
    assert text_field.order == 1.0
    assert text_field.required
    test_session.delete(text_field)


def test_create_profile_text_field(test_session, discussion, participant1_user, text_field):
    profile_text_field = ProfileTextField(
        discussion=discussion,
        agent_profile=participant1_user,
        text_field=text_field,
    )
    test_session.add(profile_text_field)
    test_session.flush()
    assert profile_text_field.discussion_id == discussion.id
    assert profile_text_field.text_field_id == text_field.id
    assert profile_text_field.agent_profile_id == participant1_user.id
    test_session.delete(profile_text_field)
