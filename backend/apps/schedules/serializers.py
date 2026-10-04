from rest_framework import serializers
from apps.schedules.models import DutySchedule
from apps.schedules.services import ScheduleService
from apps.guards.serializers import GuardSerializer
from apps.locations.serializers import LocationSerializer, PostSerializer
from apps.clients.serializers import ClientSerializer


class DutyScheduleSerializer(serializers.ModelSerializer):
    guard = GuardSerializer(read_only=True)
    client = ClientSerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    post = PostSerializer(read_only=True)

    class Meta:
        model = DutySchedule
        fields = [
            "id",
            "guard",
            "client",
            "location",
            "post",
            "shift_start",
            "shift_end",
            "status",
            "created_at",
            "updated_at",
        ]


class DutyScheduleCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutySchedule
        fields = [
            "id",
            "client",
            "location",
            "post",
            "guard",
            "shift_start",
            "shift_end",
        ]

    def create(self, validated_data):
        created_by = self.context.get("request_user")
        instance, warning = ScheduleService.create_schedule(
            client=validated_data["client"],
            location=validated_data["location"],
            post=validated_data["post"],
            guard=validated_data["guard"],
            shift_start=validated_data["shift_start"],
            shift_end=validated_data["shift_end"],
            created_by=created_by,
        )
        self.advisory_warning = warning
        return instance

    def update(self, instance, validated_data):
        updated_instance, warning = ScheduleService.update_schedule(
            instance=instance,
            data=validated_data,
        )
        self.advisory_warning = warning
        return updated_instance
