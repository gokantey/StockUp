import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('rj')


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # 4xx — safe to return validation details to client
        return response

    # 5xx — log full traceback, return generic message
    view = context.get('view', None)
    logger.error(
        'Unhandled exception in %s',
        view.__class__.__name__ if view else 'unknown view',
        exc_info=exc,
    )
    return Response(
        {'detail': 'An unexpected error occurred. Please try again later.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )