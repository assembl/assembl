import json
from pyramid.view import view_config

from assembl.indexing.utils import connect
from assembl.indexing.settings import get_index_settings


def get_curl_query(query):
    return "curl -XGET 'localhost:9200/_search?pretty' -d '{}'".format(
        json.dumps(query).replace("'", "\\u0027"))


@view_config(route_name='search', renderer='json')
def search_endpoint(context, request):
    es = connect()
    index_name = get_index_settings()['index_name']
    query = request.json_body
#    print get_curl_query(query)
    return es.search(index=index_name, body=query)


def includeme(config):
    config.add_route('search', '/_search')
