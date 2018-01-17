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


@pytest.fixture(scope="function")
def simple_role(request, test_session):
    """ A very simple Role fixture """
    from assembl.models.auth import Role
    role = Role(name='r:example_role')
    test_session.add(role)
    test_session.flush()

    def fin():
        print "Finalizing the simple_role fixture"
        test_session.delete(role)
        test_session.flush()

    request.addfinalizer(fin)
    return role


@pytest.fixture(scope="function")
def simple_role2(request, test_session):
    """ A very simple Role fixture second version """
    from assembl.models.auth import Role

    role = Role(name='r:moderator')
    test_session.add(role)
    test_session.flush()

    def fin():
        print "Finalizing the simple_role 2 fixture"
        test_session.delete(role)
        test_session.flush()

    request.addfinalizer(fin)
    return role


@pytest.fixture(scope="function")
def local_user_role(request, test_session, simple_role,
                    discussion, participant1_user):
    """ testing user local role"""
    from assembl.models.auth import LocalUserRole

    local_user_role = LocalUserRole(discussion=discussion,
                                    user=participant1_user, role=simple_role)
    test_session.add(local_user_role)
    test_session.flush()

    def fin():
        test_session.delete(local_user_role)
        test_session.flush()

    request.addfinalizer(fin)
    return local_user_role


@pytest.fixture(scope="function")
def simple_permission(request, test_session):
    """A permission fixture"""
    from assembl.models.auth import Permission
    simple_permission = Permission(name='s',)
    test_session.add(simple_permission)
    test_session.flush()

    def fin():
        print "Finalizing the simple_permission fixture"
        test_session.delete(simple_permission)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_permission


@pytest.fixture(scope="function")
def simple_discussion_permission(request, test_session, simple_role,
                                 discussion, simple_permission):
    """ A discussionPemission fixture"""
    from assembl.models.auth import DiscussionPermission
    simple_discussion_permission = DiscussionPermission(discussion=discussion,
                                                        permission=simple_permission,
                                                        role=simple_role
                                                        )

    test_session.add(simple_discussion_permission)
    test_session.flush()

    def fin():
        print "Finalizing the simple_discussion_permission fixture"
        test_session.delete(simple_discussion_permission)
        test_session.flush()

    request.addfinalizer(fin)
    return simple_discussion_permission


@pytest.fixture(scope="function")
def simple_agent_profile(request, test_session):
    from assembl.models.auth import AgentProfile
    simple_agent_profile = AgentProfile(name='simple_agent_profile',
                                        description='This is a test agent profile ')
    test_session.add(simple_agent_profile)
    test_session.flush()

    def fin():
        print "Finalizing the simple_agent_profile fixture"
        test_session.delete(simple_agent_profile)
        test_session.flush()

    request.addfinalizer(fin)
    return simple_agent_profile


@pytest.fixture(scope="function")
def simple_abstract_agent_account(request, test_session, simple_agent_profile):
    from assembl.models.auth import AbstractAgentAccount
    simple_abstract_agent_account = AbstractAgentAccount(profile_id=simple_agent_profile.id,
                                                         preferred=True, verified=True, email="toto@live.com")
    test_session.add(simple_abstract_agent_account)
    test_session.flush()

    def fin():
        print "Finalizing the simple abstract agent account"
        test_session.delete(simple_abstract_agent_account)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_abstract_agent_account


@pytest.fixture(scope="function")
def simple_partner_organization(request, test_session, discussion):
    from assembl.models.auth import PartnerOrganization
    simple_partner_organization = PartnerOrganization(discussion=discussion,
                                                      discussion_id=discussion.id, name='simple_partner_organization',
                                                      )
    test_session.add(simple_partner_organization)
    test_session.flush()

    def fin():
        print "Finalizing the simple abstract agent account"
        test_session.delete(simple_partner_organization)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_partner_organization


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
