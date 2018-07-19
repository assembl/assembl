"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
from zope import interface

from . import config_celery_app, CeleryWithConfig
from ..lib.model_watcher import get_model_watcher, BaseModelEventWatcher

# broker specified
notif_dispatch_celery_app = CeleryWithConfig('celery_tasks.notification_dispatch')


@notif_dispatch_celery_app.task()
def processPostCreatedTask(id):
    model_watcher = get_model_watcher()
    # we're inside the notification_dispatch task, so the model watcher should be
    # assembl.models.notification.ModelEventWatcherNotificationSubscriptionDispatcher
    model_watcher.processPostCreated(id)


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that will receive CRUD events and send postCreated through Celery_"""

    def processPostCreated(self, id):
        processPostCreatedTask.delay(id)


def includeme(config):
    config_celery_app(notif_dispatch_celery_app, config.registry.settings)
