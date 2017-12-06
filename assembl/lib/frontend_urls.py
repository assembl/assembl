"""Defines the existing frontend routes so the Pyramid router can pass them along."""
import datetime
import dateutil
import urllib
import simplejson as json
from urlparse import urljoin
from graphene.relay import Node
from os.path import dirname, join, exists
from ..models import Discussion


URL_DISCRIMINANTS = {
    'SOURCE': 'source',
    'NEXT': 'next'
}

SOURCE_DISCRIMINANTS = {
    'NOTIFICATION': 'notification',
    'SHARE': 'share'
}

ATTACHMENT_PURPOSES = {
    'EMBED_ATTACHMENT': 'EMBED_ATTACHMENT'
}


frontend_routes = None


def get_frontend_urls():
    """
    Get all V2 routes from source of truth
    """

    current = dirname(__file__)
    route_path = join(current, '..', 'static2/routes.json')
    if not exists(route_path):
        raise IOError("Route path could not be found")
    with open(route_path) as paths:
        routes = json.load(paths)

    # The routes string templates are in ECMAScript 6 format
    # Must convert to Python string template format
    py_routes = {}
    for name, route in routes.items():
        py_routes[name] = route.replace('${', '{')
    return py_routes


def get_timeline_for_date(discussion, date):
    """
    Gets the discussion timeline object that the given date
    lies between (inclusively)

    :param discussion: A discussion object
    :param date: A dateformatted string or datetime object
    :return: A discussion phase
    :rtype: assembl.models.timeline.DiscussionPhase
    """
    if isinstance(date, basestring):
        date = dateutil.parser.parse(date)

    phases = sorted(discussion.timeline_phases, key=lambda p: p.start)
    actual_phase = None
    for index, phase in enumerate(phases):
        # Assume all dates are in utc, no tz_info however
        if phase.start <= date < phase.end:
            actual_phase = phase
            break
    return actual_phase


# This is the same logic as in getCurrentPhaseIdentifier in v2 frontend.
def get_current_phase_identifier(timeline):
    """Return the current phase identifier, thread identifier if no timeline.
    """
    if not timeline:
        timeline = []

    current_date = datetime.datetime.utcnow()
    identifier = u''
    for phase in timeline:
        start_date = phase.start
        end_date = phase.end
        if (current_date >= start_date) and (current_date < end_date):
            identifier = phase.identifier

    return identifier or u'thread'


def current_phase_use_v1_interface(timeline):
    """Return True if the current phase use the v1 interface.
    """

    # If no timeline configured, we use v1 interface.
    if not timeline:
        return True

    current_date = datetime.datetime.utcnow()
    for phase in timeline:
        start_date = phase.start
        end_date = phase.end
        if (current_date > start_date) and (current_date < end_date):
            return phase.interface_v1

    # If current_date isn't contained in any phase, assume v2 interface.
    return False


class FrontendUrls(object):
    """The set of FrontendUrls."""
    def __init__(self, discussion):
        assert isinstance(discussion, Discussion)
        self.discussion = discussion

    frontend_discussion_routes = {
        'edition': '/edition',
        'partners': '/partners',
        'settings': '/settings',
        'timeline': '/timeline',
        'about': '/about',
        'admin_discussion_preferences': '/discussion_preferences',
        'notifications': '/notifications',
        'user_notifications': '/user/notifications',
        'profile': '/user/profile',
        'account': '/user/account',
        'user_discussion_preferences': '/user/discussion_preferences',
        'sentrytest': '/sentrytest',
        'groupSpec': '/G/*remainder',
        # 'purl_posts': '/posts*remainder',
        'purl_idea': '/idea*remainder',
        # 'purl_user': '/profile*remainder',
        'purl_widget': '/widget*remainder'
    }
    """
    The list of frontend discussion routes.

    Important:  This should match with :js:class:`Router`
    Used by :py:func:`assembl.views.backbone.views.home_view`, these routes
    will all give the same view and further routing will happen
    in the frontend."""

    frontend_admin_routes = {
        'admin_global_preferences': '/global_preferences',
    }
    """
    The list of frontend discussion routes.

    Important:  This should match with :js:class:`Router`
    Used by :py:func:`assembl.views.backbone.views.home_view`, these routes
    will all give the same view and further routing will happen
    in the frontend."""

    @classmethod
    def register_frontend_routes(cls, config):
        from assembl.views.discussion.views import home_view
        for name, route in cls.frontend_discussion_routes.iteritems():
            config.add_route(name, route)
            config.add_view(
                home_view, route_name=name, request_method='GET',
                http_cache=60)

    @classmethod
    def register_frontend_admin_routes(cls, config):
        from assembl.views.admin.views import base_admin_view
        for name, route in cls.frontend_admin_routes.iteritems():
            config.add_route(name, route)
            config.add_view(
                base_admin_view, route_name=name, request_method='GET',
                http_cache=60)

    @classmethod
    def register_legacy_routes(cls, config):
        from assembl.views.discussion.views import home_view
        for name, route in cls.frontend_discussion_routes.iteritems():
            if name.startswith('purl'):
                name = 'legacy_' + name
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

    def get_discussion_url(self, request=None):
        """
        from pyramid.request import Request
        req = Request.blank('/', base_url=self.discussion.get_base_url())
        Celery didn't like this.  To revisit once we have virtual hosts
        return req.route_url('home', discussion_slug=self.discussion.slug)

        Returns the legacy URL route. Currently, /debate/{discussion_slug}
        """

        from assembl.views import create_get_route
        if request is None:
            # Shouldn't do this. Method should only be used in context
            # of a request!
            from pyramid.threadlocal import get_current_request
            request = get_current_request()

        # TODO: If the route for 'home' is EVER changed, this value MUST be
        # synced. KEEP it as 'home' instead of 'new_home', because usage of
        # this method is kept mostly for legacy routes that do not exist in
        # new front-end yet.
        if request is None:
            route = '/debate/' + self.discussion.slug
        else:
            get_route = create_get_route(request, self.discussion)
            route = get_route('home')
        return urljoin(self.discussion.get_base_url(), route)

    # TODO: Decommission all of the route methods below. They are
    # no longer Object Oriented.
    def getUserNotificationSubscriptionsConfigurationUrl(self):
        return self.get_discussion_url() + '/user/notifications'

    def getUserNotificationSubscriptionUnsubscribeUrl(self, subscription):
        """ TODO:  Give an actual subscription URL """
        return self.getUserNotificationSubscriptionsConfigurationUrl()

    def get_relative_post_url(self, post):
        return '/posts/' + urllib.quote(post.uri(), '')

    def get_post_url(self, post):
        if current_phase_use_v1_interface(self.discussion.timeline_events):
            return self.get_discussion_url() + self.get_relative_post_url(post)
        else:
            route = None
            phase = post.get_created_phase()
            # The created post must be created within an associated phase
            assert phase
            if post.__class__.__name__ == 'SynthesisPost':
                synthesis_id = Node.to_global_id('Post', post.id)
                route = self.get_frontend_url('synthesis',
                                              slug=self.discussion.slug,
                                              synthesisId=synthesis_id)
                return urljoin(
                    self.discussion.get_base_url(),
                    route)
            first_idea = None
            ideas = [link.idea
                for link in post.indirect_idea_content_links_without_cache()
                if link.__class__.__name__ == 'IdeaRelatedPostLink']
            if ideas:
                first_idea = ideas[0]
            else:
                # orphan post, redirect to home
                from pyramid.threadlocal import get_current_request
                request = get_current_request()
                return request.route_url(
                    'new_home', discussion_slug=self.discussion.slug)

            if first_idea is not None and first_idea.__class__.__name__ ==\
                    'Question':
                thematic = post.get_closest_thematic()
                route = self.get_frontend_url('post', **{
                    'slug': self.discussion.slug,
                    'phase': phase.identifier,
                    'themeId': thematic.graphene_id(),
                    'element': ''
                })

            if not route:
                route = self.get_frontend_url('post', **{
                    'slug': self.discussion.slug,
                    'phase': phase.identifier,
                    'themeId': Node.to_global_id('Idea', first_idea.id),
                    'element': Node.to_global_id('Post', post.id)
                })

            return urljoin(self.discussion.get_base_url(), route)

    def get_relative_idea_url(self, idea):
        return '/idea/' + urllib.quote(idea.original_uri, '')

    def get_idea_url(self, idea):
        return self.get_discussion_url() + self.get_relative_idea_url(idea)

    def get_discussion_edition_url(self):
        return self.get_discussion_url() + '/edition'

    def get_frontend_url(self, route_name, **params):
        """
        Get the route that is defined in V2 front-end interface

        :param :route_name the route name defined in the front-end

        Note - there is another method :py:assembl.views.create_get_route
        which creates a global route index. In that context, to search
        for front-end routes, `furl_` must be prefixed to the route, as
        there exists collision between route names of front-end and Pyramid

        :return the relative route path
        :rtype: string
        """
        global frontend_routes
        if not frontend_routes:
            frontend_routes = get_frontend_urls()
        if route_name not in frontend_routes:
            return None
        return "/" + frontend_routes[route_name].format(**params)

    def append_query_string(self, url, **kwargs):
        if not url:
            return ''
        if url[-1] is '/':
            url = url[:-1]
        url_base = url + '?'
        f = lambda k, v: "%s=%s" % (k, v)
        qs = [f(k, v) for k, v in kwargs.iteritems() if k]
        return url_base + ('&'.join(qs)) if kwargs else ''

    def get_agentprofile_avatar_url(self, profile, pixelSize):
        return urljoin(
            self.discussion.get_base_url(), profile.external_avatar_url()+str(pixelSize))
