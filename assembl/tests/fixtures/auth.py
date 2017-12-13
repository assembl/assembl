import pytest


@pytest.fixture(scope="function")
def google_identity_provider(request, test_session):
    """Fixture for a Google Identity Provider"""
    from assembl.models.auth import IdentityProvider
    # defined in db_default_data
    return test_session.query(IdentityProvider).filter_by(
        provider_type="google-oauth2").first()


@pytest.fixture(scope="function")
def admin_social_account(request, admin_user, google_identity_provider, test_session):
    from assembl.models.social_auth import SocialAuthAccount
    sap = SocialAuthAccount(
        identity_provider=google_identity_provider,
        uid="mr_administrator@google.com",
        verified=True,
        extra_data={},
        profile=admin_user)
    test_session.add(sap)
    test_session.expire(admin_user, ['accounts', 'social_accounts'])

    def fin():
        print "finalizer admin_social_account"
        test_session.delete(sap)
        test_session.flush()
    request.addfinalizer(fin)
    return sap


@pytest.fixture(scope="function")
def participant1_social_account(request, participant1_user, google_identity_provider, test_session):
    from assembl.models.social_auth import SocialAuthAccount
    sap = SocialAuthAccount(
        identity_provider=google_identity_provider,
        uid="abloon@google.com",
        verified=True,
        extra_data={},
        profile=participant1_user)
    test_session.add(sap)
    test_session.expire(participant1_user, ['accounts', 'social_accounts'])

    def fin():
        print "finalizer participant1_social_account"
        test_session.delete(sap)
        test_session.flush()
    request.addfinalizer(fin)
    return sap
