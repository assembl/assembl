"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
from . import celery
from ..lib.model_watcher import BaseModelEventWatcher

_dispatcher = None


@celery.task()
def processPostCreatedTask(id):
    global _dispatcher
    _dispatcher.processPostCreated(id)


@celery.task()
def processPostModifiedTask(id, state_changed):
    global _dispatcher
    _dispatcher.processPostModified(id, state_changed)


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that will receive CRUD events and send postCreated through Celery_"""

    def processPostCreated(self, id):
        processPostCreatedTask.delay(id)

    def processPostModified(self, id, state_changed):
        processPostModifiedTask.delay(id, state_changed)


def create_dispatcher():
    from assembl.models.notification import (
        ModelEventWatcherNotificationSubscriptionDispatcher)
    global _dispatcher
    _dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()


def includeme(config):
    create_dispatcher()