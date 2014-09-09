from zope import interface, component
from pyramid.path import DottedNameResolver

resolver = DottedNameResolver(__package__)

class IModelEventWatcher(interface.Interface):
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
    # This is a temporary hack.
    settings = registry.settings
    class_name = settings.get(
        task_name + '.imodeleventwatcher',
        '.model_watcher.ModelEventWatcherPrinter')
    cls = resolver.resolve(class_name)
    registry.registerUtility(cls(), IModelEventWatcher)
