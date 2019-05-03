# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def fulltext_synthesis_post(request, discussion, moderator_user, test_session):
    from assembl import models
    synthesis_post = models.SynthesisPost(
        discussion=discussion,
        creator=moderator_user,
        publishes_synthesis=models.FullTextSynthesis(
            discussion=discussion,
            subject=models.LangString.create(u"a synthesis", "en"),
            body=models.LangString.create(u"Lorem ipsum dolor sit amet", "en"),
        )
    )
    test_session.add(synthesis_post)
    test_session.flush()

    def fin():
        print "finalizer synthesis"
        test_session.delete(synthesis_post)
        test_session.flush()

    request.addfinalizer(fin)

    return synthesis_post


@pytest.fixture(scope="function")
def fulltext_synthesis_post_with_image(request, discussion, moderator_user, simple_file, test_session):
    from assembl import models
    synthesis_post = models.SynthesisPost(
        discussion=discussion,
        creator=moderator_user,
        publishes_synthesis=models.FullTextSynthesis(
            discussion=discussion,
            subject=models.LangString.create(u"a synthesis with image", "en"),
            body=models.LangString.create(u"Lorem ipsum dolor sit amet", "en"),
        )
    )
    synthesis_image = models.PostAttachment(
        discussion=discussion,
        document=simple_file,
        post=synthesis_post,
        title=u"Synthesis image",
        creator=moderator_user,
        attachmentPurpose='IMAGE'
    )
    test_session.add(synthesis_post)
    test_session.flush()

    def fin():
        print "finalizer synthesis post with image"
        test_session.delete(synthesis_image)
        test_session.delete(synthesis_post)
        test_session.flush()

    request.addfinalizer(fin)

    return synthesis_post
