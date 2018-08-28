from dogpile.cache import make_region
from .config import get_config


def create_analytics_region():
    config = get_config()
    visit_analytics_region = make_region().configure(
        'dogpile.cache.redis',
        arguments={
            'host': config.get('redis_host'),
            'port': 6379,
            'redis_expiration_time': config.get('visit_analytics_region_redis_expiration_time'),
            'db': config.get('redis_socket')
        }
    )
    return visit_analytics_region