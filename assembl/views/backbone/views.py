import json
import os.path
from collections import defaultdict

from pyramid.view import view_config
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPSeeOther, HTTPUnauthorized)
from pyramid.i18n import TranslationStringFactory
from sqlalchemy.orm.exc import NoResultFound
from assembl.models import Discussion
from assembl.models.post import Post
from assembl.models.idea import Idea
from assembl.models.langstrings import Locale
from assembl.auth import P_READ, P_ADD_EXTRACT
from assembl.lib.locale import (to_posix_string, strip_country)
from assembl.lib.utils import is_url_from_same_server, path_qs
from ...models.auth import (
    UserLanguagePreference,
    LanguagePreferenceOrder,
    User,
)
from assembl.auth.util import user_has_permission
from .. import HTTPTemporaryRedirect, get_default_context as base_default_context
from assembl.lib.frontend_urls import FrontendUrls
from assembl import locale_negotiator
from assembl.nlp.translation_service import DummyGoogleTranslationService


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


def process_locale(
        locale_code, user, session, source_of_evidence):
    locale_code = to_posix_string(locale_code)
    # Updated: Now Locale is a model. Converting posix_string into its
    # equivalent model. Creates it if it does not exist
    locale = Locale.get_or_create(locale_code, session)

    if source_of_evidence in LanguagePreferenceOrder.unique_prefs:
        lang_pref_signatures = defaultdict(list)
        for lp in user.language_preference:
            lang_pref_signatures[lp.source_of_evidence].append(lp)
        while len(lang_pref_signatures[source_of_evidence]) > 1:
            # legacy multiple values
            lp = lang_pref_signatures[source_of_evidence].pop()
            lp.delete()
        if len(lang_pref_signatures[source_of_evidence]) == 1:
            lang_pref_signatures[source_of_evidence][0].locale = locale
            session.flush()
            return
        # else creation below
    else:
        lang_pref_signatures = {
            (lp.locale_id, lp.source_of_evidence)
            for lp in user.language_preference
        }
        if (locale.id, source_of_evidence) in lang_pref_signatures:
            return
    lang = UserLanguagePreference(
        user=user, source_of_evidence=source_of_evidence.value, locale=locale)
    session.add(lang)
    session.flush()


@view_config(route_name='home', request_method='GET', http_cache=60)
def home_view(request):
    user_id = authenticated_userid(request) or Everyone
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
        next_view = request.params.get('next', None)
        if not next_view and discussion:
            # If referred here from a post url, want to be able to
            # send the user back. Usually, Assembl will send the user
            # here to login on private discussions.
            referrer = request.url
            next_view = path_qs(referrer)

        if discussion.preferences['authorization_server_backend']:
            login_url = request.route_url(
                "contextual_social_auth",
                discussion_slug=discussion.slug,
                backend=discussion.preferences['authorization_server_backend'],
                _query={"next": next_view})
        elif next_view:
            login_url = request.route_url("contextual_login",
                                          discussion_slug=discussion.slug,
                                          _query={"next": next_view})
        else:
            login_url = request.route_url(
                'contextual_login', discussion_slug=discussion.slug)
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
    if user_id != Everyone:
        from assembl.models import UserPreferenceCollection
        user = User.get(user_id)
        preferences = UserPreferenceCollection(user_id, discussion)
        # TODO: user may not exist. Case of session with BD change.
        user.is_visiting_discussion(discussion.id)
        session = Discussion.default_db

        if '_LOCALE_' in request.cookies:
            locale = request.cookies['_LOCALE_']
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.Cookie)

        elif '_LOCALE_' in request.params:
            locale = request.params['_LOCALE_']
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.Parameter)
        else:
            locale = locale_negotiator(request)
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.OS_Default)
    else:
        locale = request.localizer.locale_name

    target_locale = Locale.get_or_create(
        strip_country(locale), discussion.db)

    translation_service_data = {}
    try:
        service = discussion.translation_service()
        if service:
            translation_service_data = service.serviceData()
    except:
        pass
    context['translation_service_data_json'] = json.dumps(
        translation_service_data)
    locale_labels = json.dumps(
        DummyGoogleTranslationService.target_locale_labels_cls(target_locale))
    context['translation_locale_names_json'] = locale_labels

    context['preferences_json'] = json.dumps(dict(preferences))

    response = render_to_response('../../templates/index.jinja2', context,
                                  request=request)
    # Prevent caching the home, especially for proper login/logout
    response.cache_control.max_age = 0
    response.cache_control.prevent_auto = True
    return response


@view_config(route_name='styleguide', request_method='GET', http_cache=60,
             renderer='assembl:templates/styleguide/index.jinja2')
def styleguide_view(request):
    context = get_default_context(request)
    context['styleguide_views'] = get_styleguide_components()
    return context


@view_config(route_name='test', request_method='GET', http_cache=60,
             renderer='assembl:templates/tests/index.jinja2')
def frontend_test_view(request):
    return get_default_context(request)


@view_config(context=HTTPNotFound, renderer='assembl:templates/includes/404.jinja2')
def not_found(self, request):
    request.response.status = 404
    return {}
