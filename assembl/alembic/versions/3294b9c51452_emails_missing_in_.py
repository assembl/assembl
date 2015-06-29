"""emails missing in IdentityProviderAccounts

Revision ID: 3294b9c51452
Revises: 4e6b939229c3
Create Date: 2015-06-29 11:18:10.118288

"""

# revision identifiers, used by Alembic.
revision = '3294b9c51452'
down_revision = '4e6b939229c3'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for idp_account in db.query(m.IdentityProviderAccount).filter_by(email=None):
            profile = idp_account.profile
            provider = idp_account.provider
            velruse_profile = idp_account.profile_info_json
            # Code taken from velruse auth complete
            email_accounts = {ea.email: ea for ea in profile.email_accounts}
            verified_email = None
            if 'verifiedEmail' in velruse_profile:
                verified_email = velruse_profile['verifiedEmail']
                idp_account.email = verified_email
                if verified_email in email_accounts and provider.trust_emails:
                    email_account = email_accounts[verified_email]
                    if email_account.preferred:
                        idp_account.preferred = True
                    email_account.delete()
            for num, email_d in enumerate(velruse_profile.get('emails', [])):
                if isinstance(email_d, dict):
                    email = email_d['value']
                    if num == 0 and not idp_account.email and provider.trust_emails:
                        idp_account.email = email
                    if email in email_accounts:
                        email_account = email_accounts[email]
                        if provider.trust_emails or email_account.verified:
                            if email_account.preferred:
                                idp_account.preferred = True
                            email_account.delete()
                    elif verified_email != email:
                        if email != idp_account.email:
                            # create an email account for other emails.
                            email = m.EmailAccount(
                                email=email,
                                profile=profile,
                                verified=provider.trust_emails
                            )
                            db.add(email)
                    else:
                        if email_d.get('preferred', False):
                            # maybe TODO: make the idp_account preferred,
                            # if no other account is preferred?
                            pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
