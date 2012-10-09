from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response

@view_config(route_name='home', request_method='GET', http_cache=60)
def render(request):
    return render_to_response('../../templates/backbone/index.pt', {'foo':1, 'bar':2}, request=request)