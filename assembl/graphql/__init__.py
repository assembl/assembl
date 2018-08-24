"""The module containing all graphql schemas, mutations, views, configs"""
from dogpile.cache import make_region

visit_analytics_region = make_region().configure(
    'dogpile.cache.redis',
    arguments={
        'host': 'localhost',
        'port': 6379,
        'redis_expiration_time': 60 * 60,   # 1 hour
    }
)


def includeme(config):
    config.add_route('graphql', '/{discussion_slug}/graphql')
    config.scan()
