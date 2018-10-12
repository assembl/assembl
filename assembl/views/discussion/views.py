"""The basic views that host the one-page app"""
import json
import os
import os.path
import pkg_resources

from pyramid.view import view_config
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.security import Everyone, forget
from pyramid.httpexceptions import (
    HTTPOk, HTTPNotFound, HTTPSeeOther, HTTPMovedPermanently)
from pyramid.i18n import TranslationStringFactory
from sqlalchemy.orm.exc import NoResultFound
from urllib import quote_plus
from urlparse import urljoin

from ...lib.clean_input import escape_html
from ...lib.utils import path_qs
from ...lib.sqla import get_named_object
from ...lib.frontend_urls import FrontendUrls
from ...auth import P_READ, P_ADD_EXTRACT, P_ADMIN_DISC
from ...auth.util import user_has_permission, get_non_expired_user_id
from ...models import (
    Discussion,
    User,
    Role,
    Post,
    PropositionPost,
    Idea,
    Locale,
)

from .. import (
    HTTPTemporaryRedirect, get_default_context as base_default_context,
    get_locale_from_request, get_theme_info, sanitize_next_view)
from ...nlp.translation_service import DummyGoogleTranslationService
from ..auth.views import get_social_autologin, get_login_context


FIXTURE = os.path.join(os.path.dirname(__file__),
                       '../../static/js/fixtures/nodes.json')

_ = TranslationStringFactory('assembl')

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')


def get_default_context(request):
    base = base_default_context(request)
    slug = request.matchdict['discussion_slug']
    try:
        discussion = Discussion.default_db.query(Discussion).filter(Discussion.slug==slug).one()
    except NoResultFound:
        raise HTTPNotFound(_("No discussion found for slug=%s") % slug)
    return dict(base, discussion=discussion)


def get_styleguide_components():
    """ get all .jinja2 files from templates/styleguide directory """
    views_path = os.path.join(TEMPLATE_PATH, 'styleguide', 'components')
    views = {}

    for (dirpath, dirname, filenames) in os.walk(views_path):
        for filename in filenames:
            if filename.endswith('.jinja2') and filename != 'index.jinja2':
                view_path = os.path.join('styleguide', 'components', filename)
                view_name = filename.split('.')[0].replace('_', ' ')
                views[view_name] = view_path

    return views


@view_config(route_name='home', request_method='GET', http_cache=60)
def home_view(request):
    """The main view on a discussion"""
    user_id = get_non_expired_user_id(request) or Everyone
    context = get_default_context(request)
    discussion = context["discussion"]
    canRead = user_has_permission(discussion.id, user_id, P_READ)
    if not canRead and user_id == Everyone:
        # User isn't logged-in and discussion isn't public:
        # redirect to login page
        # need to pass the route to go to *after* login as well

        # With regards to a next_view, if explicitly stated, then
        # that is the next view. If not stated, the referer takes
        # precedence. In case of failure, login redirects to the
        # discussion which is its context.
        next_view = sanitize_next_view(request.params.get('next', None))
        if not next_view and discussion:
            # If referred here from a post url, want to be able to
            # send the user back. Usually, Assembl will send the user
            # here to login on private discussions.
            referrer = request.url
            next_view = path_qs(referrer)

        login_url = get_social_autologin(request, discussion, next_view)
        if login_url:
            pass
        elif next_view:
            login_url = request.route_url("contextual_react_login",
                                          discussion_slug=discussion.slug,
                                          _query={"next": next_view})
        else:
            login_url = request.route_url(
                'contextual_react_login', discussion_slug=discussion.slug)
        return HTTPTemporaryRedirect(login_url)
    elif not canRead:
        # User is logged-in but doesn't have access to the discussion
        # Would use render_to_response, except for the 401
        from pyramid_jinja2 import IJinja2Environment
        jinja_env = request.registry.queryUtility(
            IJinja2Environment, name='.jinja2')
        template = jinja_env.get_template('cannot_read_discussion.jinja2')
        body = template.render(get_default_context(request))
        return Response(body, 401)

    # if the route asks for a post, get post content (because this is needed for meta tags)
    route_name = request.matched_route.name
    if route_name == "purl_posts":
        post_id = FrontendUrls.getRequestedPostId(request)
        if not post_id:
            return HTTPSeeOther(request.route_url(
                'home', discussion_slug=discussion.slug))
        post = Post.get_instance(post_id)
        if not post or post.discussion_id != discussion.id:
            return HTTPSeeOther(request.route_url(
                'home', discussion_slug=discussion.slug))
        context['post'] = post
    elif route_name == "purl_idea":
        idea_id = FrontendUrls.getRequestedIdeaId(request)
        if not idea_id:
            return HTTPSeeOther(request.route_url(
                'home', discussion_slug=discussion.slug))
        idea = Idea.get_instance(idea_id)
        if not idea or idea.discussion_id != discussion.id:
            return HTTPSeeOther(request.route_url(
                'home', discussion_slug=discussion.slug))
        context['idea'] = idea

    canAddExtract = user_has_permission(discussion.id, user_id, P_ADD_EXTRACT)
    context['canAddExtract'] = canAddExtract
    context['canDisplayTabs'] = True
    preferences = discussion.preferences
    session = discussion.db
    if user_id != Everyone:
        from assembl.models import UserPreferenceCollection
        # TODO: user may not exist. Case of session with BD change.
        user = User.get(user_id)
        preferences = UserPreferenceCollection(user_id, discussion)
        target_locale = get_locale_from_request(request, session, user)
        user.is_visiting_discussion(discussion.id)
    else:
        target_locale = get_locale_from_request(request, session)

    translation_service_data = {}
    try:
        service = discussion.translation_service()
        if service.canTranslate is not None:
            translation_service_data = service.serviceData()
    except:
        pass
    context['translation_service_data_json'] = json.dumps(
        translation_service_data)
    locale_labels = json.dumps(
        DummyGoogleTranslationService.target_locale_labels_cls(target_locale))
    context['translation_locale_names_json'] = locale_labels

    context['preferences_json'] = escape_html(json.dumps(dict(preferences)))
    role_names = [x for (x) in session.query(Role.name).all()]
    context['role_names'] = json.dumps(role_names)

    response = render_to_response('../../templates/index.jinja2', context,
                                  request=request)
    # Prevent caching the home, especially for proper login/logout
    response.cache_control.max_age = 0
    response.cache_control.prevent_auto = True
    return response


def bare_route_name(route_name):
    if route_name.startswith('contextual_'):
        route_name = route_name[11:]
    if route_name.startswith('react_'):
        route_name = route_name[6:]
    return route_name


def is_login_route(route_name):
    return route_name in (
        "login", "register", "request_password_change",
        "do_password_change")


def react_admin_view(request):
    """
    Checks that user is logged in and is admin of discussion
    """
    return react_view(request, required_permission=P_ADMIN_DISC)


def react_view(request, required_permission=P_READ):
    """
    The view rendered by any react-based URL requested
    """
    bare_route = bare_route_name(request.matched_route.name)
    if is_login_route(bare_route):
        request.session.pop('discussion')
        if bare_route in ("register", "login"):
            forget(request)
    old_context = base_default_context(request)
    user_id = get_non_expired_user_id(request) or Everyone
    discussion = old_context["discussion"] or None
    get_route = old_context["get_route"]
    theme_name, theme_relative_path = get_theme_info(discussion, frontend_version=2)
    node_env = os.getenv('NODE_ENV', 'production')
    common_context = {
        "theme_name": theme_name,
        "theme_relative_path": theme_relative_path,
        "REACT_URL": old_context['REACT_URL'],
        "NODE_ENV": node_env,
        "assembl_version": pkg_resources.get_distribution("assembl").version,
        "elasticsearch_lang_indexes": old_context['elasticsearch_lang_indexes'],
        "web_analytics": old_context['web_analytics'],
        "under_test": old_context['under_test']
    }

    if discussion:
        canRead = user_has_permission(discussion.id, user_id, required_permission)
        canUseReact = (is_login_route(bare_route) or
                       discussion.preferences['landing_page'])
        if not canRead and user_id == Everyone:
            # User isn't logged-in and discussion isn't public:
            # Maybe we're already in a login/register page etc.
            if is_login_route(bare_route):
                context = get_login_context(request)
                context.update(common_context)
                return context

            # otherwise redirect to login page
            next_view = sanitize_next_view(request.params.get('next', None))
            if not next_view:
                # TODO: check it's a valid v2 page using frontend_urls
                if canUseReact and request.matched_route.name in (
                        'new_home', 'react_general_page'):
                    next_view = request.path
                else:
                    next_view = request.route_path(
                        "new_home" if canUseReact else "home",
                        discussion_slug=discussion.slug)

            login_url = get_social_autologin(request, discussion, next_view)
            if login_url:
                pass
            elif next_view:
                # Assuming that the next_view already knows about canUseReact.
                # If not, will be re-routed
                login_url = request.route_url("contextual_react_login",
                                              discussion_slug=discussion.slug,
                                              _query={"next": next_view})
            else:
                login_url = request.route_url(
                    'contextual_react_login', discussion_slug=discussion.slug)
            return HTTPTemporaryRedirect(login_url)
        elif not canRead and required_permission == P_ADMIN_DISC and canUseReact:
            redirect_url = request.route_path("general_react_page",
                                               discussion_slug=discussion.slug,
                                               extra_path="unauthorizedAdministration")
            return HTTPTemporaryRedirect(redirect_url)
        elif not canRead:
            # User is logged-in but doesn't have access to the discussion
            # Would use render_to_response, except for the 401
            from pyramid_jinja2 import IJinja2Environment
            jinja_env = request.registry.queryUtility(
                IJinja2Environment, name='.jinja2')
            template = jinja_env.get_template('react_unauthorized.jinja2')
            body = template.render(get_default_context(request))
            return Response(body, 401)
        if not canUseReact:
            # Discussion not set up for landing page
            extra_path = request.path.split("/")  # There is a preceding slash
            if len(extra_path) > 2:
                # Carry over all paths after the slug
                extra_path = "/" + "/".join(extra_path[2:])
            else:
                extra_path = None
            query = request.query_string or None
            url = request.route_url('home',
                                    discussion_slug=discussion.slug,
                                    extra_path=extra_path,
                                    _query=query)
            return HTTPTemporaryRedirect(url)
        if user_id != Everyone:
            user = User.get(user_id)
            if user:
                get_locale_from_request(request)
                user.is_visiting_discussion(discussion.id)
                agent = user.get_agent_status(discussion.id)
                if agent:
                    # Check if the user has accepted GDPR cookies
                    agent.load_cookies_from_request(request)
    else:
        context = get_login_context(request)
        context.update(common_context)
        return context

    context = dict(
        request=old_context['request'],
        discussion=discussion,
        user=old_context['user'],
        error=old_context.get('error', None),
        messages=old_context.get('messages', None),
        providers_json=old_context.get('providers_json', None),
        get_route=get_route,
        **common_context
    )

    context.update({
        "opengraph_locale": old_context['opengraph_locale'],
        "get_description": old_context['get_description'],
        "get_landing_page_image": old_context['get_landing_page_image'],
        "private_social_sharing": old_context['private_social_sharing'],
        "get_topic": old_context['get_topic'],
        "discussion_title": old_context['discussion_title']
    })
    return context


def test_error_view(request):
    ctx = get_default_context(request)
    tp = request.matchdict.get('type', None)
    if not tp:
        return HTTPNotFound()
    tp = tp[0]
    from pyramid_jinja2 import IJinja2Environment
    jinja_env = request.registry.queryUtility(
        IJinja2Environment, name='.jinja2')

    if tp == 'unauthorized':
        template = jinja_env.get_template('react_unauthorized.jinja2')
        body = template.render(ctx)
        return Response(body, 401)


@view_config(route_name='styleguide', request_method='GET', http_cache=60,
             renderer='assembl:templates/styleguide/index.jinja2')
def styleguide_view(request):
    context = get_default_context(request)
    context['styleguide_views'] = get_styleguide_components()
    return context


@view_config(route_name='test', request_method='GET', http_cache=60,
             renderer='assembl:templates/tests/index.jinja2')
def frontend_test_view(request):
    context = get_default_context(request)
    discussion = context["discussion"]
    target_locale = Locale.get_or_create('en', discussion.db)
    locale_labels = json.dumps(
        DummyGoogleTranslationService.target_locale_labels_cls(target_locale))
    context['translation_locale_names_json'] = locale_labels
    context['translation_service_data_json'] = '{}'
    context['preferences_json'] = escape_html(json.dumps(dict(discussion.preferences)))
    return context


@view_config(route_name='legacy_purl_posts', request_method='GET')
@view_config(route_name='purl_posts', request_method='GET')
def purl_post(request):
    slug = request.matchdict['discussion_slug']
    discussion = Discussion.default_db.query(Discussion).\
        filter_by(slug=slug).first()
    if not discussion:
        raise HTTPNotFound()
    furl = FrontendUrls(discussion)
    post_id = furl.getRequestedPostId(request)
    post = get_named_object(post_id)
    if not post:
        raise HTTPNotFound()
    phase = discussion.current_discussion_phase()
    if (discussion.preferences['landing_page'] and (
            phase is None or not phase.interface_v1)):
        if post.__class__ == PropositionPost:
            idea = post.get_closest_thematic()
        else:
            # Assumption V2: The post is only under one idea
            # TODO: Fix assumption when posts in multiple ideas
            # are supported in V2.
            idcs = post.idea_links_of_content
            if not idcs:
                idea = None
            else:
                idc = post.idea_links_of_content[0]
                idea = idc.idea
        if not idea:
            return HTTPSeeOther(location=request.route_url(
                'new_home', discussion_slug=discussion.slug))
        return HTTPSeeOther(
            location=urljoin(
                discussion.get_base_url(),
                furl.get_frontend_url(
                    'post',
                    phase=phase.identifier,
                    themeId=idea.graphene_id(),
                    element=post.graphene_id()))
        )

    # V1 purl
    return HTTPOk(
        location=request.route_url(
            'purl_posts',
            discussion_slug=discussion.slug,
            remainder=quote_plus(type(post).uri_generic(post.id)))
    )


@view_config(route_name='legacy_purl_ideas', request_method='GET')
@view_config(route_name='purl_ideas', request_method='GET')
def purl_ideas(request):
    slug = request.matchdict['discussion_slug']
    discussion = Discussion.default_db.query(Discussion)\
        .filter_by(slug=slug).first()
    if not discussion:
        raise HTTPNotFound()
    furl = FrontendUrls(discussion)
    idea_id = furl.getRequestedIdeaId(request)
    idea = get_named_object(idea_id)
    phase = discussion.current_discussion_phase()
    if (discussion.preferences['landing_page'] and (
            phase is None or not phase.interface_v1)):
        if not idea:
            # If no idea is found, redirect to new home instead of 404
            # TODO: Determine if this is acceptable practice
            return HTTPSeeOther(location=request.route_url(
                'new_home', discussion_slug=discussion.slug))

        return HTTPSeeOther(
            location=urljoin(
                discussion.get_base_url(),
                furl.get_frontend_url(
                    'idea',
                    phase=phase.identifier,
                    themeId=idea.graphene_id())
            )
        )
    # V1 Idea
    return HTTPOk(
        location=request.route_url(
            'purl_ideas',
            discussion_slug=discussion.slug,
            remainder=quote_plus(type(idea).uri_generic(idea.id))
        )
    )


def register_react_views(config, routes, view=react_view):
    """Add list of routes to the `assembl.views.discussion.views.react_view` method."""
    if not routes:
        return
    for route in routes:
        config.add_view(view, route_name=route,
                        request_method='GET',
                        renderer='assembl:templates/index_react.jinja2')


def includeme(config):
    config.add_route('integration_page', '/integration')
    config.add_route('integration_101_page', '/integration/101/index')
    config.add_route('integration_101_form_builder_page', '/integration/101/form-builder')
    config.add_route('integration_bright_mirror_fiction', '/integration/bright-mirror/bright-mirror-fiction')

    config.add_route('new_styleguide', '/styleguide')
    config.add_route('test_error_view', '/{discussion_slug}/test/*type')
    config.add_route('new_home', '/{discussion_slug}/home')
    config.add_route('bare_slug', '/{discussion_slug}')
    config.add_route('auto_bare_slug', '/{discussion_slug}/')
    config.add_route('react_admin_page', '/{discussion_slug}/administration*extra_path')
    config.add_route('purl_ideas', '/debate/{discussion_slug}/idea/*remainder')
    config.add_route('legacy_purl_ideas', '/{discussion_slug}/idea/*remainder')
    config.add_route('purl_posts', '/debate/{discussion_slug}/posts/*remainder')
    config.add_route('legacy_purl_posts', '/{discussion_slug}/posts/*remainder')
    config.add_route('react_general_page', '/{discussion_slug}/*extra_path')

    admin_react_routes = [
        "react_admin_page",
    ]
    react_routes = [
        "new_home",
        "bare_slug",
        "new_styleguide",

        "integration_page",
        "integration_101_page",
        "integration_101_form_builder_page",
        "integration_bright_mirror_fiction",

        "react_general_page"
    ]

    register_react_views(config, admin_react_routes, react_admin_view)
    register_react_views(config, react_routes)

    # Use these routes to test global views
    config.add_view(test_error_view, route_name='test_error_view',
                    request_method='GET')

    def redirector(request):
        return HTTPMovedPermanently(request.route_url(
            'bare_slug',
            discussion_slug=request.matchdict.get('discussion_slug')))
    config.add_view(redirector, route_name='auto_bare_slug')
