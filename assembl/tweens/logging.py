import sys

from ..lib.logging import getLogger


def logging_tween_factory(handler, registry):
    """This defines a tween that will log queries."""
    def logging_tween(request):
        request.logger().info('request', method=request.method, path=request.path, getargs=request.GET)
        try:
            response = handler(request)
            request.logger().info('response', status=response.status)
            return response
        except Exception as e:
            request.logger().error("responseError", exc_info=sys.exc_info())
            raise e

    return logging_tween
