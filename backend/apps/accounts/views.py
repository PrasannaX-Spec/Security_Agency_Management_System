"""Auth views: login, refresh, me, accept-terms."""

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from common.permissions import IsAdmin
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
    """POST /api/auth/refresh - refresh wrapped in envelope.

    Refuses the refresh if the user has been deactivated since the token
    was issued, so that revoking access takes effect at the next refresh
    even when the access token is still valid.
    """

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        from apps.accounts.models import User

        raw_token = request.data.get("refresh")
        if raw_token:
            try:
                token = RefreshToken(raw_token)
                user_id = token.payload.get("user_id")
                user = User.objects.filter(id=user_id).first()
                if user and user.status == User.AccountStatus.INACTIVE:
                    return error_response(
                        "This account has been deactivated.", status=401
                    )
            except Exception:
                pass  # Let SimpleJWT handle invalid/expired tokens below.

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


class SupervisorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Supervisors and site assignments."""

    from apps.accounts.serializers import SupervisorSerializer
    serializer_class = SupervisorSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        from apps.accounts.models import User
        queryset = User.objects.filter(role=User.Role.SUPERVISOR).select_related("supervisor_profile").order_by("-date_joined")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(username__icontains=search) | queryset.filter(first_name__icontains=search)
        return queryset

    def list(self, request, *args, **kwargs):
        from apps.accounts.serializers import SupervisorSerializer
        queryset = self.filter_queryset(self.get_queryset())
        serializer = SupervisorSerializer(queryset, many=True)
        return success_response(serializer.data)

    def create(self, request, *args, **kwargs):
        from apps.accounts.serializers import SupervisorSerializer
        serializer = SupervisorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(SupervisorSerializer(user).data, status=201)

    def retrieve(self, request, *args, **kwargs):
        from apps.accounts.serializers import SupervisorSerializer
        instance = self.get_object()
        serializer = SupervisorSerializer(instance)
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        from apps.accounts.serializers import SupervisorSerializer
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = SupervisorSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(SupervisorSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="assign-sites")
    def assign_sites(self, request, pk=None):
        from apps.accounts.serializers import AssignSitesSerializer, SupervisorSerializer
        from apps.locations.models import Location, SupervisorAssignment

        supervisor = self.get_object()
        serializer = AssignSitesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        location_ids = serializer.validated_data["location_ids"]

        SupervisorAssignment.objects.filter(supervisor=supervisor).update(is_active=False)
        for loc_id in location_ids:
            loc = Location.objects.filter(id=loc_id).first()
            if loc:
                assignment, created = SupervisorAssignment.objects.get_or_create(
                    supervisor=supervisor, location=loc
                )
                assignment.is_active = True
                assignment.save()

        return success_response(SupervisorSerializer(supervisor).data)

