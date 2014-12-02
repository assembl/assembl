# -*- coding: utf-8 -*-

#py.test assembl/models/test_notifications.py -s
import pytest
from assembl.models import (
    Email,
    User,
)
from sqlalchemy import func
from .notification import ModelEventWatcherNotificationSubscriptionDispatcher

#Once this is fixed, remove the xfail from test_users_not_subscribed_to_discussion in test_notifications.py
@pytest.mark.xfail
def test_subscribe_to_discussion(test_session, 
        discussion, participant2_user):
    
    test_session.flush()
    #Removing the following assert makes the test pass.  Obviously it has the side
    # effect that the nest time we use it, the data in the relationship is stale
    assert discussion not in participant2_user.participant_in_discussion, "The user should not already be subscribed to the discussion for this test"
    participant2_user.subscribe(discussion)
    test_session.flush()
    assert discussion in participant2_user.participant_in_discussion, "The user should now be subscribed to the discussion"
    participant2_user.unsubscribe(discussion)
    test_session.flush()
    assert discussion in participant2_user.participant_in_discussion, "The user should no longer be subscribed to the discussion"
