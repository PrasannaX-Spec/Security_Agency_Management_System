"""Standard response helpers and custom exception handler.

Every API response uses the shape ``{ success, data, error }``.
"""

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def success_response(data=None, status=200):
    """Wrap *data* in the standard envelope and return a DRF Response."""
    return Response(
        {"success": True, "data": data, "error": None},
        status=status,
    )


def error_response(error, status=400):
    """Wrap *error* in the standard envelope and return a DRF Response."""
    return Response(
        {"success": False, "data": None, "error": error},
        status=status,
    )


def custom_exception_handler(exc, context):
    """DRF exception handler that wraps error payloads in the envelope."""
    response = drf_exception_handler(exc, context)
    if response is not None:
        response.data = {
            "success": False,
            "data": None,
            "error": response.data,
        }
    return response
