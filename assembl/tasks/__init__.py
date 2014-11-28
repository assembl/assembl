from os.path import join, dirname, realpath, exists

from celery import current_app
from pyramid.paster import get_appsettings
from pyramid.path import DottedNameResolver

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq
from ..lib.config import set_config
from zope.component import getGlobalSiteManager
from ..lib.model_watcher import configure_model_watcher

_inited = False

resolver = DottedNameResolver(__package__)


def configure(registry, task_name):
    settings = registry.settings
    configure_zmq(settings['changes.socket'], False)
    configure_engine(settings, False)
    get_session_maker(False)
    # temporary solution
    configure_model_watcher(registry, task_name)


def config_celery_app(celery_app, settings):
    # TODO: automate this.
    celery_app.config_from_object({
        "BROKER_URL": settings['%s.broker' % (celery_app.main,)],
        "CELERY_ROUTES": {
            'assembl.tasks.imap.import_mails': {'queue': 'imap'},
            'assembl.tasks.notification_dispatch.processAccountCreatedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processAccountModifiedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processExtractCreatedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processExtractDeletedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processExtractModifiedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processIdeaCreatedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processIdeaDeletedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processIdeaModifiedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notification_dispatch.processPostCreatedTask': {
                'queue': 'notification_dispatch'},
            'assembl.tasks.notify.notify': {'queue': 'notify'},
            'process_pending_notifications': {'queue': 'notify'},
        }})


def init_task_config(celery_app):
    global _inited
    if _inited:
        return
    rootdir = dirname(dirname(dirname(realpath(__file__))))
    if exists(join(rootdir, 'local.ini')):
        settings = get_appsettings(join(rootdir, 'local.ini'), 'assembl')
    else:
        settings = get_appsettings(join(rootdir, 'development.ini'), 'assembl')
    registry = getGlobalSiteManager()
    registry.settings = settings
    set_config(settings)
    configure(registry, celery_app.main)
    config_celery_app(celery_app, settings)
    from threaded_model_watcher import ThreadDispatcher
    threaded_watcher_class_name = settings.get(
        '%s.threadedmodelwatcher' % (celery_app.main,),
        "assembl.lib.model_watcher.ModelEventWatcherPrinter")
    ThreadDispatcher.mw_class = resolver.resolve(threaded_watcher_class_name)
    # Global celery apps
    from notify import notify_celery_app
    if notify_celery_app.main != celery_app.main:
        config_celery_app(notify_celery_app, settings)
    from notification_dispatch import notif_dispatch_celery_app
    if notif_dispatch_celery_app.main != celery_app.main:
        config_celery_app(notif_dispatch_celery_app, settings)
    _inited = True


def includeme(config):
    config.include('.threaded_model_watcher')
    configure(config.registry, 'assembl')
    config.include('.imap')
    config.include('.notification_dispatch')
    config.include('.notify')
