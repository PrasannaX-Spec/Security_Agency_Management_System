"""Public endpoints for Terms and Privacy content."""

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .content import TERMS, PRIVACY
from common.responses import success_response


class TermsView(APIView):
    """GET /api/legal/terms - public, no authentication required."""

    permission_classes = [AllowAny]

    def get(self, request):
        return success_response(TERMS)


class PrivacyView(APIView):
    """GET /api/legal/privacy - public, no authentication required."""

    permission_classes = [AllowAny]

    def get(self, request):
        return success_response(PRIVACY)
