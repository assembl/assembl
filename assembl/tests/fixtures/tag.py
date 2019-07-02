# -*- coding: utf-8 -*-
import pytest
from __future__ import print_function

@pytest.fixture(scope="function")
def tags(request, discussion, test_session):
    """ Tags """

    from assembl.models import Keyword
    tag1 = Keyword(
        value=u"tag1",
        discussion_id=discussion.id,
    )
    tag2 = Keyword(
        value=u"tag2",
        discussion_id=discussion.id,
    )
    tags = [tag1, tag2]
    test_session.add_all(tags)
    test_session.flush()

    def fin():
        print("finalizer extract_post_1_to_subidea_1_1")
        test_session.delete(tag1)
        test_session.delete(tag2)
        test_session.flush()

    request.addfinalizer(fin)
    return tags
