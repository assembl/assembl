"""Utility APIs"""
import re
from urlparse import urlparse
from os import path

import requests
from pyramid.httpexceptions import HTTPBadRequest
from pyramid.response import Response
from pyramid.view import view_config

from assembl.lib import config
from assembl.models import File

@view_config(route_name='mime_type', request_method='HEAD')
def mime_type(request):
    url = request.params.get('url', None)
    if not url:
        raise HTTPBadRequest("Missing 'url' parameter")
    parsed = urlparse(url)
    if not parsed or parsed.scheme not in ('http', 'https'):
        raise HTTPBadRequest("Wrong scheme")
    if parsed.netloc.split(":")[0] == config.get('public_hostname'):
        # is it one of our own documents?
        # If so, detect it and shortcut to avoid the pyramid handler calling
        # another pyramid handler, as this exhausts pyramid threads rapidly
        # and can deadlock the whole application
        r = re.match(
            r'^https?://[\w\.]+(?:\:\d+)?/data/.*/documents/(\d+)/data(?:\?.*)?$',
            url)
        if r:
            document_id = r.groups(0)[0]
            from sqlalchemy.sql.functions import func
            mimetype, create_date, file_identity = File.default_db.query(
                File.mime_type, File.creation_date, file.file_identity
                ).filter_by(id=int(document_id)).first()
            size = path.getsize(File.path_of(file_identity))
            return Response(
                body=None, content_type=str(mimetype),
                content_length=size, last_modified=create_date)
    try:
        result = requests.head(url, timeout=15)
    except requests.ConnectionError:
        return Response(
            status=503,
            location=url)

    return Response(
        content_type=result.headers.get('Content-Type', None),
        status=result.status_code,
        location=result.url)
