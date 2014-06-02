""" JSON-related utilities. """

from __future__ import absolute_import

from datetime import date, datetime
from json import dumps, JSONEncoder


class DateJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        else:
            return super(DateJSONEncoder, self).default(obj)


def json_renderer_factory(info):
    """ Same factory from pyramid.renderers, but with a custom encoder. """
    def _render(value, system):
        request = system.get('request')
        if request is not None:
            response = request.response
            ct = response.content_type
            if ct == response.default_content_type:
                response.content_type = 'application/json'
        return dumps(value, cls=DateJSONEncoder)
    return _render
