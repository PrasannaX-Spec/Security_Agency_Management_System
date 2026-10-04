import pytest
from django.utils import timezone
from apps.schedules.models import DutySchedule
from apps.clients.models import Client
from apps.locations.models import Location, Post
from apps.guards.models import Guard


@pytest.mark.django_db
def test_duty_schedule_fields_and_relationships(guard_profile, location_a, admin_user):
    client = Client.objects.create(
        company_name="Alpha Corp",
        contact_person="Alice",
        phone="1112223333",
        email="alice@alpha.local",
        user=admin_user,
    )
    location_a.client = client
    location_a.save()
    post = Post.objects.create(name="Gate 1", location=location_a, required_guard_count=1)

    now = timezone.now()
    schedule = DutySchedule.objects.create(
        guard=guard_profile,
        client=client,
        location=location_a,
        post=post,
        shift_start=now,
        shift_end=now + timezone.timedelta(hours=8),
        status=DutySchedule.Status.SCHEDULED,
        created_by=admin_user,
    )

    assert schedule.client == client
    assert schedule.post == post
    assert schedule.location == location_a
    assert schedule.guard == guard_profile
    assert schedule.status == DutySchedule.Status.SCHEDULED
