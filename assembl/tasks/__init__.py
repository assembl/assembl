from os.path import join, dirname, realpath, exists

from celery import Celery
from pyramid.paster import get_appsettings

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq

# broker specified
celery_queue = Celery()

_inited = False


def configure(settings):
    configure_zmq(settings['changes.socket'], False)
    engine = configure_engine(settings, False)
    DBSession = get_session_maker(False)
    celery_queue.config_from_object({"BROKER_URL":settings['celery.broker']})

def init():
    global _inited
    if _inited:
        return
    rootdir = dirname(dirname(dirname(realpath(__file__))))
    if exists(join(rootdir, 'local.ini')):
        settings = get_appsettings(join(rootdir, 'local.ini'))
    else:
        settings = get_appsettings(join(rootdir, 'development.ini'))
    configure(settings)
    _inited = True


def includeme(config):
    configure(config.registry.settings)
