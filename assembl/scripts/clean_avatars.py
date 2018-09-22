"""Reset obsolete avatar values obtained from social accounts."""

import sys
import logging.config

from pyramid.paster import get_appsettings
import requests
import transaction

from assembl.lib.sqla import (
    configure_engine, get_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.indexing.changes import configure_indexing


def clean_avatars(db):
    from assembl.models import SocialAuthAccount
    with transaction.manager:
        for idp in db.query(SocialAuthAccount).filter(
                SocialAuthAccount.picture_url != None):
            url = idp.picture_url
            if not requests.head(url).ok:
                print "Not ok", idp.id, url
                idp.picture_url = None


if __name__ == '__main__':
    config_fname = sys.argv[1]
    settings = get_appsettings(config_fname, 'assembl')
    set_config(settings)
    logging.config.fileConfig(config_fname)
    configure_zmq(settings['changes_socket'], False)
    configure_engine(settings, True)
    configure_indexing()
    session = get_session_maker()()
    clean_avatars(session)
