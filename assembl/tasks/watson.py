"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
from . import celery
from ..lib.model_watcher import get_model_watcher, BaseModelEventWatcher


@celery.task()
def processPostCreatedTask(id):
    model_watcher = get_model_watcher()
    print "Watson! "+id


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that will receive CRUD events and send postCreated through Celery_"""

    def processPostCreated(self, id):
        from assembl.models import Content
        post = Content.get(id)
        active = post.discussion.preferences['use_watson']
        if active:
            processPostCreatedTask.delay(id)
