"""Background tasks for running Assembl.

Tasks are kept running by Supervisord_.
Short-lived tasks are written as Celery_ tasks; long-running tasks are
mostly ad hoc at this point: the :py:mod:`source_reader`
and :py:mod:`changes_router`.

.. _Supervisord: http://supervisord.org/
.. _Celery: http://www.celeryproject.org/
"""
from __future__ import absolute_import

from os.path import join, dirname, realpath, exists
import ConfigParser

from pyramid.paster import get_appsettings
from pyramid.path import DottedNameResolver
from kombu import Exchange, Queue
from celery import Celery

from ..lib.sqla import configure_engine
from ..lib.zmqlib import configure_zmq
from ..lib.config import set_config
from assembl.lib.raven_client import setup_raven
from zope.component import getGlobalSiteManager
from ..lib.model_watcher import configure_model_watcher
from assembl.indexing.changes import configure_indexing


_settings = None

resolver = DottedNameResolver(__package__)


def configure(registry, task_name):
    global _settings
    settings = registry.settings
    if _settings is None:
        _settings = settings
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
        config['BROKER_URL'] = settings.get(
            '%s.broker' % (celery_app.main,), None
            ) or settings.get('celery_tasks.broker')
        celery_app.config_from_object(config, force=True)
    else:
        print "**** config_celery_app w/o broker. should not happen anymore"
        celery_app.config_from_object(config)


class CeleryWithConfig(Celery):
    "A Celery task that can receive settings"

    def on_configure_with_settings(self, settings):
        # Note that this can be called twice:
        # make sure it is idempotent
        pass

    def on_configure(self):
        global _settings
        if _settings is None:
            init_from_celery(self)
        self.on_configure_with_settings(_settings)


def init_from_celery(celery_app):
    # A task is called through celery, so it may not have basic
    # configuration setup. Go through that setup the first time.
    global _settings
    rootdir = dirname(dirname(dirname(realpath(__file__))))
    settings_file = join(rootdir, 'local.ini')
    if not exists(settings_file):
        settings_file = join(rootdir, 'production.ini')
    _settings = settings = get_appsettings(settings_file, 'assembl')
    config = ConfigParser.SafeConfigParser()
    config.read(settings_file)
    registry = getGlobalSiteManager()
    registry.settings = settings
    setup_raven(config)
    set_config(settings)
    configure_engine(settings, True)
    configure_indexing()
    configure(registry, celery_app.main)
    from .threaded_model_watcher import ThreadDispatcher
    threaded_watcher_class_name = settings.get(
        '%s.threadedmodelwatcher' % (celery_app.main,),
        "assembl.lib.model_watcher.BaseModelEventWatcher")
    ThreadDispatcher.mw_class = resolver.resolve(threaded_watcher_class_name)


def includeme(config):
    global _settings
    _settings = config.registry.settings
    config.include('.threaded_model_watcher')
    configure(config.registry, 'assembl')
    config.include('.imap')
    config.include('.notification_dispatch')
    config.include('.notify')
    config.include('.translate')
    config.include('.source_reader')
