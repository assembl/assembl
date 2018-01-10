from assembl.models import Discussion, LangString, Role, UserTemplate
from assembl.auth import R_PARTICIPANT


def test_add_discussion(test_session):
    d = Discussion(
        topic=u"Education", slug="education",
        subscribe_to_notifications_on_signup=False,
        creator=None,
        session=test_session)
    d.discussion_locales = ['en', 'fr', 'de']
    d.terms_and_conditions = LangString.create(
        u"Use the haptic JSON system, then you can quantify the cross-platform capacitor!", "en")
    d.legal_notice = LangString.create(
        u"Use the optical SCSI microchip, then you can generate the cross-platform pixel!", "en")
    test_session.flush()
    assert d.topic == u"Education"
    assert d.discussion_locales == ['en', 'fr', 'de']
    assert d.terms_and_conditions.entries[0].value == u"Use the haptic JSON system, then you can quantify the cross-platform capacitor!"  # noqa: E501
    assert d.legal_notice.entries[0].value == u"Use the optical SCSI microchip, then you can generate the cross-platform pixel!"  # noqa: E501
    test_session.delete(d)


def test_post_is_read(discussion,
                      post_viewed, post_viewed2, participant1_user,
                      participant2_user, root_post_1):
    user_id = participant1_user.id
    user_id2 = participant2_user.id
    read_post_ids = discussion.read_post_ids(user_id)
    read_post_ids2 = discussion.read_post_ids(user_id2)
    ids = list(read_post_ids)
    ids2 = list(read_post_ids2)
    assert len(ids) == 1
    assert len(ids2) == 1
    assert ids[0] == root_post_1.id
    assert ids2[0] == root_post_1.id


def test_post_is_unread(discussion,
                        participant1_user, root_post_1):
    user_id = participant1_user.id
    read_post_ids = discussion.read_post_ids(user_id)
    ids = list(read_post_ids)
    assert len(ids) == 0


def test_post_is_read_by_participant2_user(discussion, post_viewed,
                                           participant2_user, root_post_1_with_positive_message_classifier):
    user_id = participant2_user.id
    read_post_ids = discussion.read_post_ids(user_id)
    ids = list(read_post_ids)
    assert len(ids) == 0


def test_get_next_synthesis_id(discussion, discussion2):
    next_synthesis = discussion.get_next_synthesis_id()
    next_synthesis2 = discussion2.get_next_synthesis_id()
    assert discussion.next_synthesis.id == next_synthesis[0]
    assert discussion2.next_synthesis.id == next_synthesis2[0]


def test_get_user_permissions(discussion_with_permissions, participant1_user):
    user_permissions = discussion_with_permissions.get_user_permissions(
        participant1_user.id)
    assert sorted(user_permissions) == sorted(
        [
            u'add_post',
            u'delete_my_post',
            u'edit_my_post',
            u'read',
            u'read_public_cif',
            u'self_register',
            u'vote'])


def test_get_top_ideas(discussion,
                       root_idea, idea_with_en_fr, subidea_1, subidea_1_1,
                       subidea_1_1_1, subidea_1_2, announcement_en_fr):
    top_ideas = discussion.get_top_ideas()
    for idea in [root_idea, idea_with_en_fr]:
        assert idea in top_ideas
    for idea in [subidea_1, subidea_1_1, subidea_1_1_1,
                 subidea_1_2, announcement_en_fr]:
        assert idea not in top_ideas


def test_count_post_viewers1(discussion, root_post_1, post_viewed):
    number_of_post_viewers = discussion.count_post_viewers()
    assert number_of_post_viewers == 1


def test_count_post_viewers2(
        discussion, root_post_1, post_viewed, post_viewed2):
    number_of_post_viewers = discussion.count_post_viewers()
    assert number_of_post_viewers == 2


def test_get_discussion_urls(discussion):
    discussion_urls = discussion.get_discussion_urls()
    assert discussion_urls[0].endswith('/jacklayton2')


def test_slugify_topic_if_slug_is_empty(discussion):
    from assembl.lib.utils import slugify
    from assembl.models.discussion import slugify_topic_if_slug_is_empty
    slugify_topic_if_slug_is_empty(
        discussion,
        discussion.topic,
        "oldvalue",
        "initiator")
    assert discussion.slug != str(slugify(discussion.topic))
    discussion.slug = ""
    slugify_topic_if_slug_is_empty(
        discussion,
        discussion.topic,
        "oldvalue",
        "initiator")
    assert (discussion.slug) == str(slugify(discussion.topic))


def test_get_permissions_by_role(
        discussion_with_permissions, simple_role, simple_discussion_permission, simple_permission):
    permissions_by_role = discussion_with_permissions.get_permissions_by_role()
    assert simple_role.name in permissions_by_role
    assert simple_permission.name in permissions_by_role[simple_role.name]


def test_get_roles_by_permission(
        discussion_with_permissions, simple_role, simple_permission, simple_discussion_permission):
    roles_by_permission = discussion_with_permissions.get_roles_by_permission()
    assert simple_permission.name in roles_by_permission
    assert simple_role.name in roles_by_permission[simple_permission.name]


def test_adding_a_discussion_automatically_adds_participant_user_template_for_notifications(test_session):
    discussion = Discussion(
        topic=u"How great is Assembl's notification architecture?", slug="notification-architecture",
        subscribe_to_notifications_on_signup=True,
        creator=None,
        session=test_session)

    # Creation of a discussion includes automatic creation of a default user template for role participant on this discussion, which is meant to be used for default notification subscriptions
    assert len(discussion.user_templates) > 0
    participant_role = test_session.query(Role).filter_by(name=R_PARTICIPANT).one()
    user_templates_for_role_participant = test_session.query(UserTemplate).filter_by(discussion=discussion, for_role=participant_role).all()
    assert len(user_templates_for_role_participant) > 0
