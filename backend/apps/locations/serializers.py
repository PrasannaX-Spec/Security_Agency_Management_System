"""Serializers for Location (Site) and Post management."""

from rest_framework import serializers
from apps.clients.models import Client
from apps.locations.models import Location, Post, SupervisorAssignment


class PostSerializer(serializers.ModelSerializer):
    location_name = serializers.ReadOnlyField(source="location.name")

    class Meta:
        model = Post
        fields = [
            "id",
            "name",
            "location",
            "location_name",
            "required_guard_count",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_required_guard_count(self, value):
        if value < 1:
            raise serializers.ValidationError("Required guard count on a post must be at least 1.")
        return value


class LocationSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source="client.company_name")
    posts = PostSerializer(many=True, read_only=True)

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "client",
            "client_name",
            "address",
            "latitude",
            "longitude",
            "radius_m",
            "status",
            "posts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees.")
        return value

    def validate_radius_m(self, value):
        if value <= 0:
            raise serializers.ValidationError("Geofence radius must be a positive whole number greater than 0.")
        return value


class SupervisorAssignmentSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.ReadOnlyField(source="supervisor.username")
    location_name = serializers.ReadOnlyField(source="location.name")

    class Meta:
        model = SupervisorAssignment
        fields = [
            "id",
            "supervisor",
            "supervisor_name",
            "location",
            "location_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
