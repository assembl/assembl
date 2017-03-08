from ..lib.config import get as _get
from pyramid.settings import asbool as _asbool


def indexing_active():
    return _asbool(_get('use_elasticsearch'))
