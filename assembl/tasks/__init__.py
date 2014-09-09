from os.path import join, dirname, realpath, exists

from celery import current_app
from pyramid.paster import get_appsettings

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq
from zope.component import getGlobalSiteManager
from ..lib.model_watcher import configure_model_watcher

_inited = False


def configure(registry, task_name):
    settings = registry.settings
    configure_zmq(settings['changes.socket'], False)
    engine = configure_engine(settings, False)
    DBSession = get_session_maker(False)
    # temporary solution
    configure_model_watcher(registry, task_name)

def config_celery_app(celery_app, settings):
    celery_app.config_from_object({
        "BROKER_URL":settings['%s.broker' % (celery_app.main,)]})

def init_task_config():
    global _inited
    if _inited:
        return
    rootdir = dirname(dirname(dirname(realpath(__file__))))
    if exists(join(rootdir, 'local.ini')):
        settings = get_appsettings(join(rootdir, 'local.ini'))
    else:
        settings = get_appsettings(join(rootdir, 'development.ini'))
    registry = getGlobalSiteManager()
    registry.settings = settings
    configure(registry, current_app.main)
    config_celery_app(current_app, settings)
    _inited = True


def includeme(config):
    configure(config.registry, 'assembl')
    config.include('.imap')
    config.include('.notification_dispatch')
