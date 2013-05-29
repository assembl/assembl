from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response
import json
import os.path

FIXTURE = os.path.join(os.path.dirname(__file__),
                       '../../static/js/fixtures/nodes.json')


@view_config(route_name='home', request_method='GET', http_cache=60)
def home_view(request):
    return render_to_response('../../templates/index.jinja2', {}, request=request)

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
    return render_to_response('../../templates/styleguide/index.jinja2', {}, request=request)