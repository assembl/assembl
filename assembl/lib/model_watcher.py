"""
The IModelEventWatcher defines handlers for CRUD operations on certain classes.

In the :py:meth:`assembl.models.generic.Content.send_to_changes`,
:py:meth:`assembl.models.auth.User.send_to_changes`,
:py:meth:`assembl.models.idea.Idea.send_to_changes` and
:py:meth:`assembl.models.idea_content_link.Extract.send_to_changes` methods,
we call the appropriate method on the current model watcher,
given by :py:func:`assembl.lib.sqla.get_model_watcher`, which is a
class implementing the :py:class:`IModelEventWatcher` protocol.

For now, the main usage is to ultimately call the
:py:class:`assembl.models.notification.ModelEventWatcherNotificationSubscriptionDispatcher`
upon :py:class:`Content` creation, either directly or indirectly.
Each process should call :py:func:`configure_model_watcher` with its process name,
so the proper model watcher is registered.

Different scenarios are defined in ``production.ini``:

1. Noop: just print
2. Direct: Invoke the :py:class:`assembl.models.notification.ModelEventWatcherNotificationSubscriptionDispatcher`
   immediately in-thread. (May run into issues with closed transactions.)
3. Threaded: Send the CRUD event to another thread in the same process, using the :py:class:`assembl.tasks.threaded_model_watcher.ThreadedModelEventWatcher`
4. Broker (preferred): Send the event to the :py:class:`assembl.tasks.notification_dispatch.ModelEventWatcherCelerySender`, which will
   send it through the celery machinery to the :py:class:`assembl.tasks.notification_dispatch.ModelEventWatcherCeleryReceiver`.


.. class:: IModelEventWatcher

    An abstract interface for objects that receive CRUD events on some models
"""


from zope import interface
from pyramid.path import DottedNameResolver

resolver = DottedNameResolver(__package__)


class IModelEventWatcher(interface.Interface):
    """An abstract interface for objects that receive CRUD events on some models"""
    def processPostCreated(self, id):
        pass

    def processIdeaCreated(self, id):
        pass

    def processIdeaModified(self, id, version):
        pass

    def processIdeaDeleted(self, id):
        pass

    def processExtractCreated(self, id):
        pass

    def processExtractModified(self, id, version):
        pass

    def processExtractDeleted(self, id):
        pass

    def processAccountCreated(self, id):
        pass

    def processAccountModified(self, id):
        pass


class ModelEventWatcherPrinter(object):
    """A dummy :py:class:`IModelEventWatcher` for testing purposes"""
    interface.implements(IModelEventWatcher)

    def processPostCreated(self, id):
        print "processPostCreated", id

    def processIdeaCreated(self, id):
        print "processIdeaCreated", id

    def processIdeaModified(self, id, version):
        print "processIdeaModified", id, version

    def processIdeaDeleted(self, id):
        print "processIdeaDeleted", id

    def processExtractCreated(self, id):
        print "processExtractCreated", id

    def processExtractModified(self, id, version):
        print "processExtractModified", id, version

    def processExtractDeleted(self, id):
        print "processExtractDeleted", id

    def processAccountCreated(self, id):
        print "processAccountCreated", id

    def processAccountModified(self, id):
        print "processAccountModified", id


def configure_model_watcher(registry, task_name):
    """Register the proper :py:class:`IModelEventWatcher` implementation
    for this process according to ``local.ini``"""
    # This is a temporary hack.
    settings = registry.settings
    class_name = settings.get(
        task_name + '.imodeleventwatcher',
        '.model_watcher.ModelEventWatcherPrinter')
    cls = resolver.resolve(class_name)
    registry.registerUtility(cls(), IModelEventWatcher)
