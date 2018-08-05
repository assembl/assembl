"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
from . import celery
from ..lib.model_watcher import BaseModelEventWatcher


@celery.task()
def processPostCreatedTask(id):
    from assembl.models.notification import (
        ModelEventWatcherNotificationSubscriptionDispatcher)
    ModelEventWatcherNotificationSubscriptionDispatcher.createNotifications(id)


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that will receive CRUD events and send postCreated through Celery_"""

    def processPostCreated(self, id):
        processPostCreatedTask.delay(id)
