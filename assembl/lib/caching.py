from dogpile.cache import make_region
from .config import get_config

# visit_analytics_region = make_region()

def create_analytics_region():
    # global visit_analytics_region
    visit_analytics_region = make_region().configure(
        'dogpile.cache.redis',
        arguments={
            'host': get_config().get('redis_host'),
            'port': 6379,
            'redis_expiration_time': get_config().get('visit_analytics_region_redis_expiration_time')
        }
    )
    return visit_analytics_region

# def get_analytics_region():
#     return visit_analytics_region

def includeme(config):
    create_analytics_region()