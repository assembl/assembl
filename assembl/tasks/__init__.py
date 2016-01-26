from os.path import join, dirname, realpath, exists
import ConfigParser

from pyramid.paster import get_appsettings
from pyramid.path import DottedNameResolver
from kombu import Exchange, Queue

from ..lib.sqla import configure_engine
from ..lib.zmqlib import configure_zmq
from ..lib.config import set_config
from zope.component import getGlobalSiteManager
from ..lib.model_watcher import configure_model_watcher

_inited = False

resolver = DottedNameResolver(__package__)
raven_client = None


def configure(registry, task_name):
    settings = registry.settings
    if settings.get('%s_debug_signal' % (task_name,), False):
        from assembl.lib import signals
        signals.listen()
    configure_zmq(settings['changes.socket'], False)
    # temporary solution
    configure_model_watcher(registry, task_name)
    # configure them all...
    from .notify import notify_celery_app
    config_celery_app(notify_celery_app, settings)
    from .notification_dispatch import notif_dispatch_celery_app
    config_celery_app(notif_dispatch_celery_app, settings)
    from .translate import translation_celery_app
    config_celery_app(translation_celery_app, settings)
    from .imap import imap_celery_app
    config_celery_app(imap_celery_app, settings)

_celery_queues = None
_celery_routes = None

ASSEMBL_CELERY_APPS = {
    'imap': 'imap_celery_app',
    'notification_dispatch': 'notif_dispatch_celery_app',
    'notify': 'notify_celery_app',
    'translate': 'translation_celery_app'
}


def get_celery_queues():
    global _celery_queues
    if not _celery_queues:
        _celery_queues = [
            Queue(q, Exchange(q), routing_key=q)
            for q in ASSEMBL_CELERY_APPS]
    return _celery_queues


def get_celery_routes():
    global _celery_routes
    if not _celery_routes:
        _celery_routes = {}
        for module, app in ASSEMBL_CELERY_APPS.iteritems():
            full_module_name = "assembl.tasks."+module
            mod = __import__(full_module_name, fromlist=[app])
            app = getattr(mod, app)
            for task_name in app.tasks:
                if task_name.startswith(full_module_name):
                    _celery_routes[task_name] = {
                        'queue': module, 'routing_key': module}
    return _celery_routes


def config_celery_app(celery_app, settings=None):
    config = {
        "CELERY_QUEUES": get_celery_queues(),
        "CELERY_ROUTES": get_celery_routes(),
        "CELERY_TASK_SERIALIZER": 'json',
        "CELERY_ACKS_LATE": True,
        "CELERY_STORE_ERRORS_EVEN_IF_IGNORED": True}
    if settings is not None:
        config['BROKER_URL'] = settings['%s.broker' % (celery_app.main,)]
        celery_app.config_from_object(config, force=True)
    else:
        celery_app.config_from_object(config)


def init_task_config(celery_app):
    global _inited
    if _inited:
        return
    rootdir = dirname(dirname(dirname(realpath(__file__))))
    settings_file = join(rootdir, 'local.ini')
    if not exists(settings_file):
        settings_file = join(rootdir, 'development.ini')
    settings = get_appsettings(settings_file, 'assembl')
    config = ConfigParser.SafeConfigParser()
    config.read(settings_file)
    try:
        pipeline = config.get('pipeline:main', 'pipeline').split()
        if 'raven' in pipeline:
            global raven_client
            raven_dsn = config.get('filter:raven', 'dsn')
            from raven import Client
            from raven.contrib.celery import (
                register_signal, register_logger_signal)
            raven_client = Client(raven_dsn)
            register_logger_signal(raven_client)
            register_signal(raven_client)
    except ConfigParser.Error:
        pass
    registry = getGlobalSiteManager()
    registry.settings = settings
    set_config(settings)
    configure_engine(settings, False)
    configure(registry, celery_app.main)
    from threaded_model_watcher import ThreadDispatcher
    threaded_watcher_class_name = settings.get(
        '%s.threadedmodelwatcher' % (celery_app.main,),
        "assembl.lib.model_watcher.ModelEventWatcherPrinter")
    ThreadDispatcher.mw_class = resolver.resolve(threaded_watcher_class_name)
    _inited = True


def first_init():
    from .imap import imap_celery_app
    from .notification_dispatch import notif_dispatch_celery_app
    from .notify import notify_celery_app
    from .translate import translation_celery_app
    config_celery_app(imap_celery_app)
    config_celery_app(notify_celery_app)
    config_celery_app(notif_dispatch_celery_app)
    config_celery_app(translation_celery_app)


# This allows us to use celery CLI monitoring
first_init()


def includeme(config):
    config.include('.threaded_model_watcher')
    configure(config.registry, 'assembl')
    config.include('.imap')
    config.include('.notification_dispatch')
    config.include('.notify')
    config.include('.translate')
    config.include('.source_reader')
