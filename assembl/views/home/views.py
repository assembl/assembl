from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response
import os.path
from assembl.synthesis.models import Discussion

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')


def get_default_context():
    return {
        'STATIC_URL': '/static/'
    }

@view_config(route_name='discussion_list', request_method='GET', http_cache=60)
def discussion_list_view(request):
    context = get_default_context()
    context['discussions'] = Discussion.db.query(Discussion)
    return render_to_response('../../templates/discussion_list.jinja2', context, request=request)
