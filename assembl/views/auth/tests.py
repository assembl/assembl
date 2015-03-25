# -*- coding: utf-8 -*-
from collections import OrderedDict


def test_assembl_login(discussion, participant1_user, test_app, request):
    url = test_app.app.request_factory({}).route_path(
        'contextual_login', discussion_slug=discussion.slug)
    # here we have to know it's "password", as the non-hashed password value
    # is not stored in the object.
    res = test_app.post(url, OrderedDict([
        ('identifier', participant1_user.get_preferred_email()),
        ('password', 'password')]))
    assert res.status_code == 302
