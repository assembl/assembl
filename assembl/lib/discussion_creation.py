"""
A plugin api for processes that will be run when a discussion is created
"""

from zope import interface
from pyramid.path import DottedNameResolver
from pyramid.config import aslist

resolver = DottedNameResolver(__package__)


class IDiscussionCreationCallback(interface.Interface):
    """defines a plugin that will called when a discussion is created"""
    def discussionCreated(self, discussion):
        pass


class DiscussionCreationPrinter(object):
    """A dummy :py:class:`IDiscussionCreationCallback` for testing purposes"""
    interface.implements(IDiscussionCreationCallback)

    def discussionCreated(self, discussion):
        print "discussionCreated", discussion


def setup_discussion_callbacks(registry):
    """Register all :py:class:`IDiscussionCreationCallback` implementations
    according to ``local.ini``"""
    settings = registry.settings
    class_names = aslist(settings.get('discussion_callbacks', ''))
    for class_name in class_names:
        cls = resolver.resolve(class_name)
        registry.registerUtility(cls(), IDiscussionCreationCallback)


def includeme(config):
    setup_discussion_callbacks(config.registry)
