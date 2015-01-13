import json
import os.path

from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import HTTPNotFound, HTTPSeeOther, HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory
from sqlalchemy.orm.exc import NoResultFound

from assembl.models import Discussion
from assembl.auth import P_READ, P_ADD_EXTRACT
from assembl.auth.util import user_has_permission
from .. import get_default_context as base_default_context


FIXTURE = os.path.join(os.path.dirname(__file__),
                       '../../static/js/fixtures/nodes.json')

_ = TranslationStringFactory('assembl')

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')


def get_default_context(request):
    base = base_default_context(request)
    slug = request.matchdict['discussion_slug']
    try:
        discussion = Discussion.db.query(Discussion).filter(Discussion.slug==slug).one()
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
    user_id = authenticated_userid(request) or Everyone
    context = get_default_context(request)
    canRead = user_has_permission(context["discussion"].id, user_id, P_READ)
    if not canRead and user_id == Everyone:
        #User isn't logged-in and discussion isn't public, redirect to login page
        login_url = request.route_url('login',_query={'next_view':request.current_route_path()})
        return HTTPSeeOther(login_url)
    elif not canRead:
        #User is logged-in but doesn't have access to the discussion
        return HTTPUnauthorized()
    
    canAddExtract = user_has_permission(context["discussion"].id, user_id, P_ADD_EXTRACT)
    context['canAddExtract'] = canAddExtract
    context['canDisplayTabs'] = True
    response = render_to_response('../../templates/index.jinja2', context, request=request)
    # Prevent caching the home, especially for proper login/logout
    response.cache_control.max_age = 0
    response.cache_control.prevent_auto = True
    return response

@view_config(route_name='edition', request_method='GET', http_cache=60)
def edition_view(request):
    return home_view(request)

@view_config(route_name='partners', request_method='GET', http_cache=60)
def partners_view(request):
    return home_view(request)

@view_config(route_name='slug_notifications', request_method='GET', http_cache=60)
def slug_notifications_view(request):
    return home_view(request)

@view_config(route_name='profile', request_method='GET', http_cache=60)
def profile_view(request):
    return home_view(request)

@view_config(route_name='user_notifications', request_method='GET', http_cache=60)
def notifications_view(request):
    return home_view(request)

@view_config(route_name='purl_idea', request_method='GET', http_cache=60)
def idea_view(request):
    return home_view(request)

@view_config(route_name='purl_posts', request_method='GET', http_cache=60)
def posts_view(request):
    return home_view(request)

@view_config(renderer='json', route_name='nodetest', request_method='GET', http_cache=60)
def dummy_node_data(request):
    f = open(FIXTURE)
    contents = f.read()
    f.close()
    contents = json.loads(contents)
    return contents

@view_config(route_name='styleguide', request_method='GET', http_cache=60)
def styleguide_view(request):
    context = get_default_context(request)
    context['styleguide_views'] = get_styleguide_components()
    return render_to_response('../../templates/styleguide/index.jinja2', context, request=request)

@view_config(route_name='test', request_method='GET', http_cache=60)
def frontend_test_view(request):
    context = get_default_context(request)
    return render_to_response('../../templates/tests/index.jinja2', context, request=request)

@view_config(route_name='graph_view', request_method='GET', http_cache=60)
def graph_view(request):
    context = get_default_context(request)
    return render_to_response(os.path.join(TEMPLATE_PATH, 'infovis.jinja2'), context, request=request)

@view_config(context=HTTPNotFound, renderer='assembl:templates/includes/404.jinja2')
def not_found(self, request):
    request.response.status = 404
    return {}