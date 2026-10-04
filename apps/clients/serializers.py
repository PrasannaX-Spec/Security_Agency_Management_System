"""Serializers for Client management."""

from django.db import transaction
from rest_framework import serializers
from apps.accounts.models import User
from apps.clients.models import Client


class ClientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, default="client123")

    class Meta:
        model = Client
        fields = [
            "id",
            "username",
            "password",
            "company_name",
            "contact_person",
            "phone",
            "email",
            "address",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_email(self, value):
        instance = getattr(self, "instance", None)
        qs = Client.objects.filter(email=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Client with this email already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.pop("username", None)
        password = validated_data.pop("password", "client123")
        email = validated_data.get("email")

        if not username:
            username = email.split("@")[0].lower().replace(".", "_")

        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "User account with this username already exists."})

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=User.Role.CLIENT,
            )
            client = Client.objects.create(user=user, **validated_data)
            return client

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
