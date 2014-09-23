# -*- coding: utf-8 -*-

import pytest
from assembl.models import (
    Idea, Post, Email, User, NotificationSubscriptionFollowSyntheses
)

def test_subscribe_notification(test_session, 
        discussion, participant1_user, reply_post_2, test_app, root_post_1):
    
    test_session.flush()
    import pdb
    pdb.set_trace()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription)
    test_session.flush()

