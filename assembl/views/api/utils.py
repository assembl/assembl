from urlparse import urlparse
import requests
from pyramid.httpexceptions import HTTPBadRequest
from pyramid.response import Response
from pyramid.view import view_config


@view_config(route_name='mime_type', request_method='HEAD')
def mime_type(request):
    url = request.params.get('url', None)
    if not url:
        raise HTTPBadRequest("Missing 'url' parameter")
    parsed = urlparse(url)
    if not parsed or parsed.scheme not in ('http', 'https'):
        raise HTTPBadRequest("Wrong scheme")
    try:
        result = requests.head(url)
    except requests.ConnectionError:
        return Response(
        status=503,
        location=url)
    
    return Response(
        content_type=result.headers['Content-Type'],
        status=result.status_code,
        location=result.url)
