from ..models import Discussion
from urlparse import urljoin
import urllib


class FrontendUrls():
    def __init__(self, discussion):
        assert isinstance(discussion, Discussion)
        self.discussion = discussion

    # Note:  This should match with assembl/static/js/app/router.js
    frontend_routes = {
        'edition': '/edition',
        'partners': '/partners',
        'settings': '/settings',
        'notifications': '/notifications',
        'user_notifications': '/user/notifications',
        'profile': '/user/profile',
        'account': '/user/account',
        'sentrytest': '/sentrytest',
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

    # used for route 'purl_posts': '/posts*remainder'
    @staticmethod
    def getRequestedPostId(request):
        if 'remainder' in request.matchdict:
            return '/'.join(i for i in request.matchdict['remainder'])
        return None

    # used for route 'purl_idea': '/idea*remainder'
    @staticmethod
    def getRequestedIdeaId(request):
        if 'remainder' in request.matchdict:
            return '/'.join(i for i in request.matchdict['remainder'])
        return None

    def getDiscussionLogoUrl(self):
        return urljoin(
            self.discussion.get_base_url(), '/static/img/assembl.png')

    def get_discussion_url(self):
        from pyramid.request import Request
        #req = Request.blank('/', base_url=self.discussion.get_base_url())
        #Celery didn't like this.  To revisit once we have virtual hosts
        #return req.route_url('home', discussion_slug=self.discussion.slug)
        return urljoin(
            self.discussion.get_base_url(), self.discussion.slug)

    def getUserNotificationSubscriptionsConfigurationUrl(self):
        return self.get_discussion_url() + '/user/notifications'

    def getUserNotificationSubscriptionUnsubscribeUrl(self, subscription):
        """ TODO:  Give an actual subscription URL """
        return self.getUserNotificationSubscriptionsConfigurationUrl()

    def get_post_url(self, post):
        return self.get_discussion_url() + '/posts/' + urllib.quote(post.uri(), '')

    def get_idea_url(self, idea):
        return self.get_discussion_url() + '/idea/' + urllib.quote(idea.uri(), '')

    def get_discussion_edition_url(self):
        return self.get_discussion_url() + '/edition'

    def get_agentprofile_avatar_url(self, profile, pixelSize):
        return urljoin(
            self.discussion.get_base_url(), profile.external_avatar_url()+str(pixelSize))