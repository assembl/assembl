import pytest


@pytest.fixture(scope="function")
def google_identity_provider(request, test_session):
    from assembl.models.auth import IdentityProvider
    # defined in db_default_data
    return test_session.query(IdentityProvider).filter_by(
        provider_type="google-oauth2").first()
