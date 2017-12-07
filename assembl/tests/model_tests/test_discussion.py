from assembl.models import Discussion, LangString


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
    assert d.topic == u"Education"
    assert d.discussion_locales == ['en', 'fr', 'de']
    assert d.terms_and_conditions.entries[0].value == u"Use the haptic JSON system, then you can quantify the cross-platform capacitor!"  # noqa: E501
    assert d.legal_notice.entries[0].value == u"Use the optical SCSI microchip, then you can generate the cross-platform pixel!"  # noqa: E501
