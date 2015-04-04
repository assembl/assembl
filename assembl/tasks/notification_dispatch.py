from celery import Celery
from zope import interface

from . import init_task_config, config_celery_app
from ..lib.model_watcher import IModelEventWatcher
from ..lib.sqla import get_model_watcher

# broker specified
notif_dispatch_celery_app = Celery('celery_tasks.notification_dispatch')


class ModelEventWatcherCeleryReceiver(object):
    interface.implements(IModelEventWatcher)

    singleton = None

    @classmethod
    def get_instance(cls):
        if not cls.singleton:
            cls.singleton = cls()
        return cls.singleton

    def __init__(self):
        init_task_config(notif_dispatch_celery_app)
        self.mw = get_model_watcher()
        assert self.mw

    def processPostCreated(self, id):
        self.mw.processPostCreated(id)

    def processIdeaCreated(self, id):
        self.mw.processIdeaCreated(id)

    def processIdeaModified(self, id, version):
        self.mw.processIdeaModified(id, version)

    def processIdeaDeleted(self, id):
        self.mw.processIdeaDeleted(id)

    def processExtractCreated(self, id):
        self.mw.processExtractCreated(id)

    def processExtractModified(self, id, version):
        self.mw.processExtractModified(id, version)

    def processExtractDeleted(self, id):
        self.mw.processExtractDeleted(id)

    def processAccountCreated(self, id):
        self.mw.processAccountCreated(id)

    def processAccountModified(self, id):
        self.mw.processAccountModified(id)


@notif_dispatch_celery_app.task()
def processPostCreatedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processPostCreated(id)


@notif_dispatch_celery_app.task()
def processIdeaCreatedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processIdeaCreated(id)


@notif_dispatch_celery_app.task()
def processIdeaModifiedTask(id, version):
    ModelEventWatcherCeleryReceiver.get_instance().processIdeaModified(id, version)


@notif_dispatch_celery_app.task()
def processIdeaDeletedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processIdeaDeleted(id)


@notif_dispatch_celery_app.task()
def processExtractCreatedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processExtractCreated(id)


@notif_dispatch_celery_app.task()
def processExtractModifiedTask(id, version):
    ModelEventWatcherCeleryReceiver.get_instance().processExtractModified(id, version)


@notif_dispatch_celery_app.task()
def processExtractDeletedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processExtractDeleted(id)


@notif_dispatch_celery_app.task()
def processAccountCreatedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processAccountCreated(id)


@notif_dispatch_celery_app.task()
def processAccountModifiedTask(id):
    ModelEventWatcherCeleryReceiver.get_instance().processAccountModified(id)


class ModelEventWatcherCelerySender(object):
    interface.implements(IModelEventWatcher)

    def processPostCreated(self, id):
        processPostCreatedTask.delay(id)

    def processIdeaCreated(self, id):
        processIdeaCreatedTask.delay(id)

    def processIdeaModified(self, id, version):
        processIdeaModifiedTask.delay(id, version)

    def processIdeaDeleted(self, id):
        processIdeaDeletedTask.delay(id)

    def processExtractCreated(self, id):
        processExtractCreatedTask.delay(id)

    def processExtractModified(self, id, version):
        processExtractModifiedTask.delay(id, version)

    def processExtractDeleted(self, id):
        processExtractDeletedTask.delay(id)

    def processAccountCreated(self, id):
        processAccountCreatedTask.delay(id)

    def processAccountModified(self, id):
        processAccountModifiedTask.delay(id)


def includeme(config):
    config_celery_app(notif_dispatch_celery_app, config.registry.settings)
