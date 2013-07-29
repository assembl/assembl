from sqlalchemy.orm.exc import NoResultFound

from models import IdentityProvider
from ..lib.sqla import DBSession


def get_identity_provider(name, create=True):
    provider = None
    try:
        provider = DBSession.query(IdentityProvider.id).filter(
            IdentityProvider.name == name).one()
    except NoResultFound:
        if create:
            provider = IdentityProvider(name=name)
            DBSession.add(provider)
    return provider
