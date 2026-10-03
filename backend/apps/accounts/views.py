"""Auth views: login, refresh, me, accept-terms."""

from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import LoginSerializer, UserSerializer
from apps.legal.content import LEGAL_VERSION
from common.responses import success_response, error_response


class LoginView(APIView):
    """POST /api/auth/login - authenticate and return JWT tokens."""

    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: None})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(serializer.errors, status=400)
        return success_response(serializer.validated_data)


class CustomTokenRefreshView(TokenRefreshView):
    """POST /api/auth/refresh - standard JWT refresh wrapped in envelope."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return success_response(response.data)
        return response


class MeView(APIView):
    """GET /api/auth/me - return the current user's profile."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        serializer = UserSerializer(request.user)
        return success_response(serializer.data)


class AcceptTermsView(APIView):
    """POST /api/auth/accept-terms - record that the user accepts the current version."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.terms_accepted_at = timezone.now()
        user.terms_version = LEGAL_VERSION
        user.save(update_fields=["terms_accepted_at", "terms_version"])
        return success_response({"terms_version": LEGAL_VERSION})
