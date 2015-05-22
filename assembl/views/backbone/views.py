import json
import os.path
import transaction

from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import HTTPNotFound, HTTPSeeOther, HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory, default_locale_negotiator
from sqlalchemy.orm.exc import NoResultFound
from assembl.models import Discussion
from assembl.models.post import Post
from assembl.models.idea import Idea
from assembl.auth import P_READ, P_ADD_EXTRACT
from assembl.lib.locale import to_posix_format, ensure_locale_has_country
from ...models.auth import (
    UserLanguagePreference,
    LanguagePreferenceOrder,
    User,
)
from assembl.auth.util import user_has_permission
from .. import get_default_context as base_default_context
from assembl.lib.frontend_urls import FrontendUrls


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


def process_locale(posix_locale, user_id, current_prefs, session, order):
    # Current is the current locale for the given order (ex. 'en' for
    # cookie order)
    current = [x for x in current_prefs if x.preferred_order == order]
    user = session.query(User).filter_by(id = user_id).first()

    # Fresh slate for user, create a lang_pref
    if not current_prefs:
        lang = UserLanguagePreference(lang_code=posix_locale,
                                      preferred_order=order,
                                      user=user,
                                      explicitly_defined=False)
        session.add(lang)
        session.flush()

    elif posix_locale in {x.lang_code for x in current_prefs}:

        if not current:
            # current priority does not exist, but locale does
            updated_pref = session.query(UserLanguagePreference).\
                filter_by(user_id=user_id, lang_code=posix_locale).\
                first()
            updated_pref.preferred_order = order
            session.flush()

        elif current[0].lang_code != posix_locale:
            # Current priority exists, but is not the desired locale
            # Update current to desired local, remove current.
            pref_to_remove = session.query(UserLanguagePreference).\
                filter_by(user_id=user_id, preferred_order=order).first()

            session.delete(pref_to_remove)
            session.flush()

            updated_pref = \
                session.query(UserLanguagePreference).\
                filter_by(user_id=user_id, lang_code=posix_locale).\
                first()

            updated_pref.preferred_order = order
            session.flush()

        else:
            print "Current %s locale exists." % order

    # non-empty list of current preferences, and current locale does not exist
    elif current_prefs and not current:
        lang = UserLanguagePreference(lang_code=posix_locale,
                                      preferred_order=order,
                                      user=user,
                                      explicitly_defined=False)
        session.add(lang)
        session.flush()

    # Finally, locale not previously set, and there exists a previous
    # priority locale
    else:
        pref = session.query(UserLanguagePreference).\
            filter_by(user_id=user_id, preferred_order=order).first()
        pref.lang_code = posix_locale
        session.add(pref)
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
        login_url = request.route_url(
            'contextual_login', discussion_slug=discussion.slug)
        return HTTPSeeOther(login_url)
    elif not canRead:
        # User is logged-in but doesn't have access to the discussion
        return HTTPUnauthorized()

    # if the route asks for a post, get post content (because this is needed for meta tags)
    route_name = request.matched_route.name
    if route_name == "purl_posts":
        post_id = FrontendUrls.getRequestedPostId(request)
        if post_id:
            post = Post.get_instance(post_id)
            if post and post.discussion_id == discussion.id:
                context['post'] = post
    elif route_name == "purl_idea":
        idea_id = FrontendUrls.getRequestedIdeaId(request)
        if idea_id:
            idea = Idea.get_instance(idea_id)
            if idea and idea.discussion_id == discussion.id:
                context['idea'] = idea

    canAddExtract = user_has_permission(discussion.id, user_id, P_ADD_EXTRACT)
    context['canAddExtract'] = canAddExtract
    context['canDisplayTabs'] = True
    if user_id != Everyone:
        from assembl.models import AgentProfile
        user = AgentProfile.get(user_id)
        # TODO: user may not exist. Case of session with BD change.
        user.is_visiting_discussion(discussion.id)
        session = Discussion.default_db
        current_prefs = session.query(UserLanguagePreference).\
            filter_by(user_id = user_id).all()
        user = session.query(User).filter_by(id = user_id).first()

        def validate_locale(l):
            return ensure_locale_has_country(to_posix_format(locale))

        if '_LOCALE_' in request.cookies:
            locale = request.cookies['_LOCALE_']
            posix_locale = validate_locale(locale)
            process_locale(posix_locale, user_id,
                           current_prefs, session,
                           LanguagePreferenceOrder.Cookie)

        elif '_LOCALE_' in request.params:
            locale = request.params['_LOCALE_']
            posix_locale = validate_locale(locale)
            process_locale(posix_locale, user_id,
                           current_prefs, session,
                           LanguagePreferenceOrder.Parameter)
        else:
            locale = default_locale_negotiator(request)
            posix_locale = validate_locale(locale)
            process_locale(posix_locale, user_id,
                           current_prefs, session,
                           LanguagePreferenceOrder.OS_Default)


    response = render_to_response('../../templates/index.jinja2', context, request=request)
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


@view_config(route_name='graph_view', request_method='GET', http_cache=60,
             renderer='assembl:templates/infovis.jinja2')
def graph_view(request):
    return get_default_context(request)


@view_config(context=HTTPNotFound, renderer='assembl:templates/includes/404.jinja2')
def not_found(self, request):
    request.response.status = 404
    return {}
