# -*- coding: utf-8 -*-
import pytest
from datetime import datetime, timedelta

@pytest.fixture(scope="function")
def bright_mirror(phases, graphql_request, graphql_registry, test_session):
    import os
    from io import BytesIO
    from assembl.graphql.schema import Schema as schema

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': [
                {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
            ],
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [
                    {'value': u"Title FR announce", 'localeCode': u"fr"},
                    {'value': u"Title EN announce", 'localeCode': u"en"}
                ],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ]
            }
        })

    bright_mirror_id = res.data['createThematic']['thematic']['id']
    return bright_mirror_id


@pytest.fixture(scope="function")
def post_published_for_bright_mirror(
        request, test_session, discussion, admin_user,
        bright_mirror):
    from assembl.models import Post, Idea, LangString, IdeaRelatedPostLink, PublicationStates
    from graphene.relay import Node
    idea_id = bright_mirror
    raw_id = int(Node.from_global_id(idea_id)[1])
    idea = Idea.get(raw_id)
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"Published"),
        body=LangString.create(u"A simple published fiction"),
        type='post', publication_state=PublicationStates.PUBLISHED,
        message_id="msgpublished@example2.com",
        creation_date = datetime.utcnow() - timedelta(days=1))

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer post_published_for_bright_mirror"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p

@pytest.fixture(scope="function")
def post_published_for_bright_mirror_participant(
        request, test_session, discussion, admin_user, participant1_user,
        bright_mirror):
    from assembl.models import Post, Idea, LangString, IdeaRelatedPostLink, PublicationStates
    from graphene.relay import Node
    idea_id = bright_mirror
    raw_id = int(Node.from_global_id(idea_id)[1])
    idea = Idea.get(raw_id)
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"Published by participant"),
        body=LangString.create(u"A simple published fiction by participant"),
        type='post', publication_state=PublicationStates.PUBLISHED,
        message_id="msgpublisheparticipant2@example2.com",
        creation_date = datetime.utcnow())

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer post_published_for_bright_mirror"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def participant_published_post_with_parent_post_for_bright_mirror(
        request, test_session, discussion, admin_user, participant1_user,
        bright_mirror, post_published_for_bright_mirror):
    from assembl.models import Post, Idea, LangString, IdeaRelatedPostLink, PublicationStates
    from graphene.relay import Node
    idea_id = bright_mirror
    raw_id = int(Node.from_global_id(idea_id)[1])
    idea = Idea.get(raw_id)
    parent_post_id = post_published_for_bright_mirror.id
    post = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"Published by participant"),
        body=LangString.create(u"A simple published fiction by participant"),
        type='post', publication_state=PublicationStates.PUBLISHED,
        message_id="msgpublisheparticipant2@example2.com",
        creation_date=datetime.utcnow(),
        parent_id=parent_post_id
        )

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=post)

    test_session.add(post)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer participant_published_post_with_parent_post_for_bright_mirror"
        test_session.delete(post)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return post


@pytest.fixture(scope="function")
def post_draft_for_bright_mirror(
        request, test_session, discussion, moderator_user,
        bright_mirror):
    from assembl.models import Post, Idea, LangString, IdeaRelatedPostLink, PublicationStates
    from graphene.relay import Node
    idea_id = bright_mirror
    raw_id = int(Node.from_global_id(idea_id)[1])
    idea = Idea.get(raw_id)
    p = Post(
        discussion=discussion, creator=moderator_user,
        subject=LangString.create(u"Draft"),
        body=LangString.create(u"A simple draft fiction"),
        type='post', publication_state=PublicationStates.DRAFT,
        message_id="msgdraft@example2.com",
        creation_date = datetime.utcnow() - timedelta(days=7))

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=moderator_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer post_draft_for_bright_mirror"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p