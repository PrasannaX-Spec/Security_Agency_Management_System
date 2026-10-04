import pytest
from datetime import timedelta
from django.utils import timezone
from apps.schedules.serializers import DutyScheduleSerializer, DutyScheduleCreateUpdateSerializer


@pytest.mark.django_db
def test_schedule_serializers(schedule_setup):
    client, loc, post, guard, admin = schedule_setup
    now = timezone.now().replace(minute=0, second=0, microsecond=0)

    data = {
        "client": client.id,
        "location": loc.id,
        "post": post.id,
        "guard": guard.id,
        "shift_start": now.isoformat(),
        "shift_end": (now + timedelta(hours=8)).isoformat(),
    }
    ser = DutyScheduleCreateUpdateSerializer(data=data, context={"request_user": admin})
    assert ser.is_valid(), ser.errors
    instance = ser.save()

    assert instance.id is not None
    assert hasattr(ser, "advisory_warning")

    read_ser = DutyScheduleSerializer(instance)
    assert read_ser.data["id"] == instance.id
    assert read_ser.data["guard"]["id"] == guard.id
    assert read_ser.data["location"]["id"] == loc.id
    assert read_ser.data["post"]["id"] == post.id
