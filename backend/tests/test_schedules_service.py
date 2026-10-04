import pytest
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.clients.models import Client
from apps.locations.models import Location, Post
from apps.guards.models import Guard
from apps.schedules.models import DutySchedule
from apps.schedules.services import ScheduleService
from apps.schedules.exceptions import ScheduleConflictError


@pytest.mark.django_db

def test_create_schedule_success(schedule_setup):
    client, loc, post, guard, admin = schedule_setup
    now = timezone.now().replace(minute=0, second=0, microsecond=0)
    sched, warning = ScheduleService.create_schedule(
        client=client,
        location=loc,
        post=post,
        guard=guard,
        shift_start=now,
        shift_end=now + timedelta(hours=8),
        created_by=admin,
    )
    assert sched.id is not None
    assert sched.status == DutySchedule.Status.SCHEDULED
    assert warning is None


@pytest.mark.django_db
def test_overlap_matrix_rejection(schedule_setup):
    client, loc, post, guard, admin = schedule_setup
    now = timezone.now().replace(minute=0, second=0, microsecond=0)
    s_start = now + timedelta(hours=8)
    s_end = now + timedelta(hours=16)
    ScheduleService.create_schedule(
        client=client,
        location=loc,
        post=post,
        guard=guard,
        shift_start=s_start,
        shift_end=s_end,
        created_by=admin,
    )

    # 1. Identical
    with pytest.raises(ScheduleConflictError):
        ScheduleService.create_schedule(
            client=client,
            location=loc,
            post=post,
            guard=guard,
            shift_start=s_start,
            shift_end=s_end,
        )

    # 2. Starts inside
    with pytest.raises(ScheduleConflictError):
        ScheduleService.create_schedule(
            client=client,
            location=loc,
            post=post,
            guard=guard,
            shift_start=s_start + timedelta(hours=2),
            shift_end=s_end + timedelta(hours=2),
        )

    # 3. Ends inside
    with pytest.raises(ScheduleConflictError):
        ScheduleService.create_schedule(
            client=client,
            location=loc,
            post=post,
            guard=guard,
            shift_start=s_start - timedelta(hours=2),
            shift_end=s_end - timedelta(hours=2),
        )

    # 4. Encompasses
    with pytest.raises(ScheduleConflictError):
        ScheduleService.create_schedule(
            client=client,
            location=loc,
            post=post,
            guard=guard,
            shift_start=s_start - timedelta(hours=1),
            shift_end=s_end + timedelta(hours=1),
        )

    # 5. Contained inside
    with pytest.raises(ScheduleConflictError):
        ScheduleService.create_schedule(
            client=client,
            location=loc,
            post=post,
            guard=guard,
            shift_start=s_start + timedelta(hours=1),
            shift_end=s_end - timedelta(hours=1),
        )


@pytest.mark.django_db
def test_back_to_back_and_cancelled_allowed(schedule_setup):
    client, loc, post, guard, admin = schedule_setup
    now = timezone.now().replace(minute=0, second=0, microsecond=0)
    s_start = now + timedelta(hours=8)
    s_end = now + timedelta(hours=16)
    s1, _ = ScheduleService.create_schedule(
        client=client,
        location=loc,
        post=post,
        guard=guard,
        shift_start=s_start,
        shift_end=s_end,
        created_by=admin,
    )

    # Back-to-back: starts exactly when s1 ends
    s2, _ = ScheduleService.create_schedule(
        client=client,
        location=loc,
        post=post,
        guard=guard,
        shift_start=s_end,
        shift_end=s_end + timedelta(hours=8),
        created_by=admin,
    )
    assert s2.id is not None

    # Cancel s1, then create overlapping shift in same slot
    ScheduleService.cancel_schedule(s1)
    s3, _ = ScheduleService.create_schedule(
        client=client,
        location=loc,
        post=post,
        guard=guard,
        shift_start=s_start,
        shift_end=s_end,
        created_by=admin,
    )
    assert s3.id is not None
