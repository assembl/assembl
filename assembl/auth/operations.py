from sqlalchemy.orm.exc import NoResultFound

from models import IdentityProvider
from ..lib.sqla import DBSession


def get_identity_provider(name, create=True):
    provider = None
    provider = DBSession.query(IdentityProvider).filter_by(
        name=name).first()
    if create and not provider:
        provider = IdentityProvider(name=name)
        DBSession.add(provider)
    return provider
