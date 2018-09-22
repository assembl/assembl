"""Scripts that can be run from the CLI"""

import logging

from pyramid.paster import get_appsettings, bootstrap

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq
from ..lib.model_watcher import configure_model_watcher
from ..lib.config import set_config
from ..indexing.changes import configure_indexing


def boostrap_configuration(config):
    logging.config.fileConfig(config)
    env = bootstrap(config)
    settings = get_appsettings(config, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes_socket'], False)
    configure_model_watcher(env['registry'], 'assembl')
    configure_engine(settings, True)
    configure_indexing()
    session = get_session_maker()()
    return session
