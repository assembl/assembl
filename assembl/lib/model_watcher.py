from zope import interface, component
from pyramid.path import DottedNameResolver

resolver = DottedNameResolver(__package__)

class IModelEventWatcher(interface.Interface):
    def processPostCreated(id):
        pass

    def processIdeaCreated(id):
        pass

    def processIdeaModified(id, version):
        pass

    def processIdeaDeleted(id):
        pass

    def processExtractCreated(id):
        pass

    def processExtractModified(id, version):
        pass

    def processExtractDeleted(id):
        pass

    def processAccountCreated(id):
        pass

    def processAccountModified(id):
        pass


class PassiveModelEventWatcher(object):
    interface.implements(IModelEventWatcher)
    def __init__(self):
        pass

    def processPostCreated(id):
        print "I was called."


class CeleryTaskModelEventWatcher(object):
    interface.implements(IModelEventWatcher)
    def processPostCreated(id):
        pass  # TODO


class CelerySendModelEventWatcher(object):
    interface.implements(IModelEventWatcher)

    def processPostCreated(id):
        pass  # TODO: Use celery queue


def configure_model_watcher(registry, task_name):
    # This is a temporary hack.
    settings = registry.settings
    print task_name + '.imodeleventwatcher'
    class_name = settings.get(
        task_name + '.imodeleventwatcher',
        '.model_watcher.PassiveModelEventWatcher')
    cls = resolver.resolve(class_name)
    registry.registerUtility(cls(), IModelEventWatcher)
