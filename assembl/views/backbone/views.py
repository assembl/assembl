from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import get_localizer, TranslationStringFactory
import json
import os.path
from assembl.synthesis.models import Discussion
from assembl.auth import get_user, P_READ, P_ADD_EXTRACT, user_has_permission
from sqlalchemy.orm.exc import NoResultFound

from .. import get_default_context as base_default_context

FIXTURE = os.path.join(os.path.dirname(__file__),
                       '../../static/js/fixtures/nodes.json')

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')

_ = TranslationStringFactory('assembl')

def js_message_ids():
    from babel.messages.pofile import read_po
    pot = read_po(open(os.path.join(os.path.dirname(__file__), '..', '..', 'locale', 'assembl.pot')))
    def is_js(msg):
        for (filename, lineno) in msg.locations:
            if filename.endswith('.js'):
                return True
    return [m.id for m in pot if is_js(m)]

JS_MESSAGE_IDS = js_message_ids()

def get_default_context(request):
    base = base_default_context(request)
    slug = request.matchdict['discussion_slug']
    try:
        discussion = Discussion.db.query(Discussion).filter(Discussion.slug==slug).one()
    except NoResultFound:
        raise HTTPNotFound(_("No discussion found for slug=%s" % slug))
    return dict(base, templates=get_template_views(), discussion=discussion)


def get_template_views():
    """ get all .tmpl files from templates/views directory """
    views_path = os.path.join(TEMPLATE_PATH, 'views')
    views = []

    for (dirpath, dirname, filenames) in os.walk(views_path):
        for filename in filenames:
            if filename.endswith('.tmpl'):
                views.append(filename.split('.')[0])

    return views


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


@view_config(route_name='home', request_method='GET', http_cache=60, permission=P_READ)
def home_view(request):
    canAddExtract = False
    user_id = authenticated_userid(request) or Everyone
    context = get_default_context(request)
    canAddExtract = user_has_permission(context["discussion"].id, user_id, P_ADD_EXTRACT)

    context['canAddExtract'] = canAddExtract
    return render_to_response('../../templates/index.jinja2', context, request=request)

@view_config(route_name='home_idea', request_method='GET', http_cache=60)
def idea_view(request):
    return home_view(request)

@view_config(route_name='home_idea_slug', request_method='GET', http_cache=60)
def idea_slug_view(request):
    return home_view(request)

@view_config(route_name='home_message', request_method='GET', http_cache=60)
def message_view(request):
    return home_view(request)

@view_config(route_name='home_message_slug', request_method='GET', http_cache=60)
def message_slug_view(request):
    return home_view(request)

@view_config(route_name='toc', request_method='GET', http_cache=60)
def toc_view(request):
    return render_to_response('../../templates/backbone/index.pt', {}, request=request)


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

