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
from zope.component import getGlobalSiteManager
from pyramid.path import DottedNameResolver

from .logging import getLogger


log = getLogger()
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


@interface.implementer(IModelEventWatcher)
class BaseModelEventWatcher(object):
    """A dummy :py:class:`IModelEventWatcher` for testing purposes"""

    def processPostCreated(self, id):
        log.debug("processPostCreated: %d" % (id or 0))

    def processIdeaCreated(self, id):
        log.debug("processIdeaCreated: %d" % (id or 0))

    def processIdeaModified(self, id, version):
        log.debug("processIdeaModified: %d %d" % (id or 0, version or -1))

    def processIdeaDeleted(self, id):
        log.debug("processIdeaDeleted: %d" % (id or 0))

    def processExtractCreated(self, id):
        log.debug("processExtractCreated: %d" % (id or 0))

    def processExtractModified(self, id, version):
        log.debug("processExtractModified: %d %d" % (id or 0, version or -1))

    def processExtractDeleted(self, id):
        log.debug("processExtractDeleted: %d" % (id or 0))

    def processAccountCreated(self, id):
        log.debug("processAccountCreated: %d" % (id or 0))

    def processAccountModified(self, id):
        log.debug("processAccountModified: %d" % (id or 0))


@interface.implementer(IModelEventWatcher)
class CompositeModelEventWatcher(object):
    """A dummy :py:class:`IModelEventWatcher` for testing purposes"""

    def __init__(self, *watchers):
        self.watchers = watchers

    def processPostCreated(self, id):
        for watcher in self.watchers:
            watcher.processPostCreated(id)

    def processIdeaCreated(self, id):
        for watcher in self.watchers:
            watcher.processIdeaCreated(id)

    def processIdeaModified(self, id, version):
        for watcher in self.watchers:
            watcher.processIdeaModified(id, version)

    def processIdeaDeleted(self, id):
        for watcher in self.watchers:
            watcher.processIdeaDeleted(id)

    def processExtractCreated(self, id):
        for watcher in self.watchers:
            watcher.processExtractCreated(id)

    def processExtractModified(self, id, version):
        for watcher in self.watchers:
            watcher.processExtractModified(id, version)

    def processExtractDeleted(self, id):
        for watcher in self.watchers:
            watcher.processExtractDeleted(id)

    def processAccountCreated(self, id):
        for watcher in self.watchers:
            watcher.processAccountCreated(id)

    def processAccountModified(self, id):
        for watcher in self.watchers:
            watcher.processAccountModified(id)


_MODEL_WATCHER = None


def get_model_watcher():
    """Get the global implementation of py:class:`assembl.lib.model_watcherIModelEventWatcher`
    for this process.

    Often set in :py:func:`assembl.lib.model_watcher.configure_model_watcher`.
    """
    global _MODEL_WATCHER
    if _MODEL_WATCHER is None:
        watchers = list(
            getGlobalSiteManager().getAllUtilitiesRegisteredFor(IModelEventWatcher))
        if not len(watchers):
            watchers = (BaseModelEventWatcher(),)
        if len(watchers) == 1:
            _MODEL_WATCHER = watchers[0]
        else:
            _MODEL_WATCHER = CompositeModelEventWatcher(*watchers)
    return _MODEL_WATCHER


def configure_model_watcher(registry, task_name):
    """Register the proper :py:class:`IModelEventWatcher` implementation
    for this process according to ``local.ini``"""
    # This is a temporary hack.
    settings = registry.settings
    class_names = settings.get(
        task_name + '.imodeleventwatcher',
        '.model_watcher.BaseModelEventWatcher').split()
    for class_name in class_names:
        cls = resolver.resolve(class_name)
        registry.registerUtility(cls(), IModelEventWatcher, name=cls.__name__)
