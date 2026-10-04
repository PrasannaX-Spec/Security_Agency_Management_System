from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, SupervisorProfile
from apps.legal.content import LEGAL_VERSION
from apps.locations.models import Location, SupervisorAssignment


class UserSerializer(serializers.ModelSerializer):
    needs_terms_acceptance = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "availability_status",
            "terms_accepted_at",
            "terms_version",
            "needs_terms_acceptance",
            "status",
        )
        read_only_fields = ("id", "terms_accepted_at", "terms_version")

    def get_needs_terms_acceptance(self, obj):
        return obj.terms_version != LEGAL_VERSION


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Unable to log in with provided credentials.")

        if user.status == User.AccountStatus.INACTIVE:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["username"] = user.username

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class SupervisorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, default="super123")

    phone = serializers.CharField(source="supervisor_profile.phone", required=False, default="")
    status = serializers.CharField(source="supervisor_profile.status", required=False, default="ACTIVE")
    availability = serializers.CharField(source="supervisor_profile.availability", required=False, default="AVAILABLE")
    assigned_location_ids = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "status",
            "availability",
            "assigned_location_ids",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]

    def get_assigned_location_ids(self, obj):
        return list(
            SupervisorAssignment.objects.filter(supervisor=obj, is_active=True).values_list("location_id", flat=True)
        )

    def create(self, validated_data):
        profile_data = validated_data.pop("supervisor_profile", {})
        username = validated_data.pop("username", None)
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", "super123")

        if not username:
            username = f"sup_{User.objects.filter(role=User.Role.SUPERVISOR).count() + 1}"
        if not email:
            email = f"{username}@agency.local"

        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "User with this username already exists."})

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=User.Role.SUPERVISOR,
                **validated_data,
            )
            SupervisorProfile.objects.create(
                user=user,
                phone=profile_data.get("phone", ""),
                status=profile_data.get("status", "ACTIVE"),
                availability=profile_data.get("availability", "AVAILABLE"),
            )
            return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("supervisor_profile", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = getattr(instance, "supervisor_profile", None)
        if not profile:
            profile = SupervisorProfile.objects.create(user=instance)

        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance


class AssignSitesSerializer(serializers.Serializer):
    location_ids = serializers.ListField(
        child=serializers.IntegerField(), required=True, allow_empty=True
    )

