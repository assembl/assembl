# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def abstract_tags(request, discussion, test_session):
    """ Abstract Tags """

    from assembl.models import AbstractTag
    tag1 = AbstractTag(
        value=u"tag1",
        discussion_id=discussion.id,
    )
    tag2 = AbstractTag(
        value=u"tag2",
        discussion_id=discussion.id,
    )
    abstract_tags = [tag1, tag2]
    test_session.add_all(abstract_tags)
    test_session.flush()

    def fin():
        test_session.delete(tag1)
        test_session.delete(tag2)
        test_session.flush()

    request.addfinalizer(fin)
    return abstract_tags