from __future__ import absolute_import
import traceback
from threading import current_thread
import logging

from pyramid.threadlocal import get_current_request
import structlog


def logger_for_request(request):
    if getattr(request, '_logger', None) is None:
        request._logger = LOGGER.bind(
            user=request.authenticated_userid,
            request=id(request),
        )
    if request.matchdict and 'discussion' not in request._logger._context:
        from ..auth.util import discussion_from_request
        discussion = discussion_from_request(request)
        slug = discussion.slug if discussion else None
        request._logger = request._logger.bind(discussion=slug)
    return request._logger


def getLogger(logger_name=None):
    request = get_current_request()
    if request and request.logger:
        logger = request.logger()
    else:
        logger = LOGGER
    if logger_name is not None:
        logger = logger.bind(name=logger_name)
    return logger


def simulate_stdlib_logging(wrapped_logger, method_name, event_dict):
    # Make a structlog event into a logging event
    msg = event_dict.pop('event')
    # store the keys for retrieval by update_with_kwargs
    event_dict['_keys'] = event_dict.keys()
    return ([msg], {'extra': event_dict})


def update_with_kwargs(logger, method_name, event_dict):
    # Recreate a structlog-like record readable by the ConsoleFormatter
    # even if we started from a logging record
    record = event_dict['_record']
    event_dict['level'] = record.levelname.lower()
    event_dict['logger'] = record.name
    extra_keys = getattr(record, '_keys', None)
    if extra_keys:
        # Get the structlog values into the event_dict
        if '_name' in extra_keys:
            # Special case: allow to set _name in logging parameters
            # to override default logger name.
            event_dict['logger'] = record._name
            extra_keys.remove('_name')
        event_dict.update({k: getattr(record, k) for k in extra_keys})
    for k in ('user', 'request'):
        v = getattr(record, k, None)
        if v is not None:
            event_dict[k] = v
    return event_dict


class ConsoleFormatter(structlog.stdlib.ProcessorFormatter):
    def __init__(self, fmt=None, datefmt=None):
        timestamper = structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S")
        super(ConsoleFormatter, self).__init__(
            processor= structlog.dev.ConsoleRenderer(colors=True),
            foreign_pre_chain= [
                structlog.stdlib.add_log_level,
                timestamper,
                update_with_kwargs
            ],
            fmt=fmt, datefmt=datefmt
        )

    def format(self, record):
        return super(ConsoleFormatter, self).format(record)


structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeEncoder(),
        simulate_stdlib_logging
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

LOGGER = structlog.getLogger('assembl')


def includeme(config):
    """add request.logger"""
    config.add_request_method(
        'assembl.lib.logging.logger_for_request', 'logger')
