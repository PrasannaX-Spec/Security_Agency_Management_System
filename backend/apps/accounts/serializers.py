"""Serializers for authentication and user endpoints."""

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.legal.content import LEGAL_VERSION


class LoginSerializer(serializers.Serializer):
    """Validate credentials, return JWT tokens and basic user info."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["username"],
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError("Invalid username or password.")
        if user.status == User.AccountStatus.INACTIVE:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "needs_terms_acceptance": user.terms_version != LEGAL_VERSION,
            },
        }


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the current user for /auth/me."""

    needs_terms_acceptance = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "availability_status",
            "terms_accepted_at",
            "terms_version",
            "status",
            "needs_terms_acceptance",
        ]

    def get_needs_terms_acceptance(self, obj):
        return obj.terms_version != LEGAL_VERSION


class AcceptTermsSerializer(serializers.Serializer):
    """Marks the current user as having accepted the current legal version."""

    # No input fields needed; acceptance is implicit on POST.
    pass
