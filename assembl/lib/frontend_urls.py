from ..models import Discussion
from urlparse import urljoin
import urllib


class FrontendUrls():
    def __init__(self, discussion):
        assert isinstance(discussion, Discussion)
        self.discussion = discussion

    frontend_routes = {
        'edition': '/edition',
        'partners': '/partners',
        'settings': '/settings',
        'notifications': '/notifications',
        'user_notifications': '/user/notifications',
        'profile': '/user/profile',
        'account': '/user/account',
        'purl_posts': '/posts*remainder',
        'purl_idea': '/idea*remainder'
    }

    @classmethod
    def register_frontend_routes(cls, config):
        from assembl.views.backbone.views import home_view
        for name, route in cls.frontend_routes.iteritems():
            config.add_route(name, route)
            config.add_view(
                home_view, route_name=name, request_method='GET',
                http_cache=60)

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
            self.getDiscussionUrl(), 'user/notifications')

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