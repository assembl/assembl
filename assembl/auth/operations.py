from models import IdentityProvider
from ..db import DBSession


def get_identity_provider(auth_context, create=True):
    provider = None
    provider = DBSession.query(IdentityProvider).filter_by(
        provider_type=auth_context.provider_type,
        name=auth_context.provider_name
        ).first()
    if create and not provider:
        provider = IdentityProvider(
            provider_type=auth_context.provider_type,
            name=auth_context.provider_name)
        DBSession.add(provider)
    return provider
