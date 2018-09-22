"""Background tasks for running Assembl.

Tasks are kept running by Supervisord_.
Short-lived tasks are written as Celery_ tasks; long-running tasks are
mostly ad hoc at this point: the :py:mod:`source_reader`
and :py:mod:`changes_router`.

.. _Supervisord: http://supervisord.org/
.. _Celery: http://www.celeryproject.org/
"""
from __future__ import absolute_import

from os import getcwd
from os.path import join, dirname, realpath, exists
import ConfigParser

from pyramid.paster import get_appsettings
from pyramid.path import DottedNameResolver
from datetime import timedelta
from celery import Celery
from pyramid_mailer import mailer_factory_from_settings

from ..lib.sqla import configure_engine
from ..lib.zmqlib import configure_zmq
from ..lib.config import set_config
from assembl.lib.raven_client import setup_raven
from zope.component import getGlobalSiteManager
from ..lib.model_watcher import configure_model_watcher
from assembl.indexing.changes import configure_indexing
from ..lib.logging import getLogger


_settings = None

resolver = DottedNameResolver(__package__)


def configure(registry, task_name):
    global _settings
    settings = registry.settings
    if _settings is None:
        _settings = settings
    # temporary solution
    configure_model_watcher(registry, task_name)
    config = {
        "CELERY_TASK_SERIALIZER": 'json',
        "CELERY_ACKS_LATE": True,
        "CELERY_CACHE_BACKEND": settings.get('celery_tasks.broker', ''),
        "CELERY_RESULT_BACKEND": settings.get('celery_tasks.broker', ''),
        "CELERY_STORE_ERRORS_EVEN_IF_IGNORED": True,
    }
    config['BROKER_URL'] = settings.get(
        '%s.broker' % (celery.main,), None
    ) or settings.get('celery_tasks.broker')
    celery.config_from_object(config, force=True)


CELERYBEAT_SCHEDULE = {
    'resend-every-10-minutes': {
        'task': 'assembl.tasks.notify.process_pending_notifications',
        'schedule': timedelta(seconds=600),
        'options': {
            'routing_key': 'notify',
            'exchange': 'notify'
        }
    },
}

# Minimum delay between emails sent to a domain.
# For this to work, you need to have a SINGLE celery process for notification.
SMTP_DOMAIN_DELAYS = {
    '': timedelta(0)
}

# INI file values with this prefix will be used to populate SMTP_DOMAIN_DELAYS.
# Anything after the last dot is a domain name (including empty).
# Use seconds (float) as values.
SETTINGS_SMTP_DELAY = "celery_tasks.notify.smtp_delay."


class CeleryWithConfig(Celery):
    "A Celery task that can receive settings"

    _preconf = {
        "CELERYBEAT_SCHEDULE": CELERYBEAT_SCHEDULE
    }

    def on_configure(self):
        global _settings
        if _settings is None:
            # i.e. includeme not called, i.e. not from pyramid
            self.init_from_celery()

    def init_from_celery(self):
        # A task is called through celery, so it may not have basic
        # configuration setup. Go through that setup the first time.
        global _settings, SMTP_DOMAIN_DELAYS
        rootdir = getcwd()
        settings_file = join(rootdir, 'local.ini')
        if not exists(settings_file):
            settings_file = join(rootdir, 'production.ini')
        if not exists(settings_file):
            rootdir = dirname(dirname(dirname(realpath(__file__))))
            settings_file = join(rootdir, 'local.ini')
        if not exists(settings_file):
            settings_file = join(rootdir, 'production.ini')
        if not exists(settings_file):
            raise RuntimeError("Missing settings file")
        _settings = settings = get_appsettings(settings_file, 'assembl')
        configure_zmq(settings['changes_socket'], False)
        config = ConfigParser.SafeConfigParser()
        config.read(settings_file)
        registry = getGlobalSiteManager()
        registry.settings = settings
        setup_raven(config)
        set_config(settings)
        configure_engine(settings, True)
        configure_indexing()
        if settings.get('%s_debug_signal' % (self.main,), False):
            from assembl.lib import signals
            signals.listen()
        configure(registry, self.main)
        from .threaded_model_watcher import ThreadDispatcher
        threaded_watcher_class_name = settings.get(
            '%s.threadedmodelwatcher' % (self.main,),
            "assembl.lib.model_watcher.BaseModelEventWatcher")
        ThreadDispatcher.mw_class = resolver.resolve(
            threaded_watcher_class_name)
        self.mailer = mailer_factory_from_settings(settings)
        # setup SETTINGS_SMTP_DELAY
        for name, val in settings.iteritems():
            if name.startswith(SETTINGS_SMTP_DELAY):
                try:
                    val = timedelta(seconds=float(val))
                except ValueError:
                    print "Not a valid value for %s: %s" % (name, val)
                    continue
                SMTP_DOMAIN_DELAYS[name[len(SETTINGS_SMTP_DELAY):]] = val
        getLogger().info("SMTP_DOMAIN_DELAYS", delays=SMTP_DOMAIN_DELAYS)
        import assembl.tasks.imap
        import assembl.tasks.notify
        import assembl.tasks.notification_dispatch
        import assembl.tasks.translate


celery = CeleryWithConfig('celery_tasks')


def includeme(config):
    global _settings
    _settings = config.registry.settings
    config.include('.threaded_model_watcher')
    configure(config.registry, 'assembl')
    config.include('.source_reader')
