import os

FIXTURE_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'static', 'js', 'tests', 'fixtures')
API_PREFIX = '/api/v1/'
API_DISCUSSION_PREFIX = API_PREFIX + 'discussion/{discussion_id:\d+}'


def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_route('csrf_token', 'api/v1/token')
    config.add_route('mime_type', 'api/v1/mime_type')
