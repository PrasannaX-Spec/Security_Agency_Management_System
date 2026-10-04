"""Serializers for Guard management."""

from django.db import transaction
from rest_framework import serializers
from apps.accounts.models import User
from apps.guards.models import Guard


class GuardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, default="guard123")

    class Meta:
        model = Guard
        fields = [
            "id",
            "username",
            "email",
            "password",
            "full_name",
            "phone",
            "id_number",
            "dob",
            "address",
            "experience_years",
            "joining_date",
            "wage_type",
            "wage_rate",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_id_number(self, value):
        instance = getattr(self, "instance", None)
        qs = Guard.objects.filter(id_number=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Guard with this ID number already exists.")
        return value

    def validate_wage_rate(self, value):
        if value < 0:
            raise serializers.ValidationError("Wage rate cannot be negative.")
        return value

    def create(self, validated_data):
        username = validated_data.pop("username", None)
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", "guard123")

        id_num = validated_data.get("id_number", "")
        if not username:
            username = f"guard_{id_num.lower()}"
        if not email:
            email = f"{username}@agency.local"

        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "User with this username already exists."})

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=User.Role.GUARD,
            )
            guard = Guard.objects.create(user=user, **validated_data)
            return guard

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
