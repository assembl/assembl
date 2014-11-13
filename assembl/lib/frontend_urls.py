from ..models import Discussion
from urlparse import urljoin
import urllib


class FrontendUrls():
    def __init__(self, discussion):
        assert isinstance(discussion, Discussion)
        self.discussion = discussion

    def getDiscussionLogoUrl(self):
        return urljoin(
            self.discussion.get_base_url(), '/static/img/assembl.png')

    def getDiscussionUrl(self):
        from pyramid.request import Request
        req = Request.blank('/', base_url=self.discussion.get_base_url())
        #Celery didn't like this.  To revisit once we have virtual hosts
        #return req.route_url('home', discussion_slug=self.discussion.slug)
        return urljoin(
            self.discussion.get_base_url(), self.discussion.slug+'/')

    def getUserNotificationSubscriptionsConfigurationUrl(self):
        return urljoin(
            self.getDiscussionUrl(), 'users/notifications')

    def getUserNotificationSubscriptionUnsubscribeUrl(self, subscription):
        """ TODO:  Give an actual subscription URL """
        return self.getUserNotificationSubscriptionsConfigurationUrl()

    def getPostUrl(self, post):
        return urljoin(
            self.getDiscussionUrl(), 'posts/' + urllib.quote(post.uri(), ''))

    def get_discussion_edition_url(self):
        return urljoin(
            self.getDiscussionUrl(), 'edition')

    def get_agentprofile_avatar_url(self, profile, pixelSize):
        return urljoin(
            self.discussion.get_base_url(), profile.external_avatar_url()+str(pixelSize))