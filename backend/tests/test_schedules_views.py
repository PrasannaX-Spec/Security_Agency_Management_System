import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from apps.accounts.models import User
from apps.locations.models import SupervisorAssignment


@pytest.mark.django_db
def test_admin_schedule_crud_and_conflict(api_client, admin_user, schedule_setup):
    client, loc, post, guard, _ = schedule_setup
    api_client.force_authenticate(user=admin_user)
    now = timezone.now().replace(minute=0, second=0, microsecond=0)

    # 1. Create Shift
    payload = {
        "client": client.id,
        "location": loc.id,
        "post": post.id,
        "guard": guard.id,
        "shift_start": now.isoformat(),
        "shift_end": (now + timedelta(hours=8)).isoformat(),
    }
    res = api_client.post("/api/schedules/", payload)
    assert res.status_code == status.HTTP_201_CREATED
    assert res.data["success"] is True
    sched_id = res.data["data"]["schedule"]["id"]

    # 2. Duplicate overlap -> 409 with structured details
    res_conflict = api_client.post("/api/schedules/", payload)
    assert res_conflict.status_code == status.HTTP_409_CONFLICT
    assert res_conflict.data["success"] is False
    assert res_conflict.data["error"]["code"] == "SCHEDULE_CONFLICT"
    assert res_conflict.data["error"]["conflicting_schedule"]["id"] == sched_id

    # 3. Cancel Shift
    res_cancel = api_client.post(f"/api/schedules/{sched_id}/cancel/")
    assert res_cancel.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_role_scoping_and_detail_protection(api_client, supervisor_user, guard_user, schedule_setup):
    client, loc, post, guard, admin = schedule_setup
    now = timezone.now().replace(minute=0, second=0, microsecond=0)
    api_client.force_authenticate(user=admin)
    payload = {
        "client": client.id,
        "location": loc.id,
        "post": post.id,
        "guard": guard.id,
        "shift_start": (now + timedelta(hours=1)).isoformat(),
        "shift_end": (now + timedelta(hours=9)).isoformat(),
    }
    res = api_client.post("/api/schedules/", payload)
    assert res.status_code == status.HTTP_201_CREATED
    sched_id = res.data["data"]["schedule"]["id"]

    # Guard forbidden on main endpoint
    api_client.force_authenticate(user=guard_user)
    assert api_client.get("/api/schedules/").status_code == status.HTTP_403_FORBIDDEN

    # Guard allowed on /my/
    res_my = api_client.get("/api/schedules/my/")
    assert res_my.status_code == status.HTTP_200_OK
    assert len(res_my.data["data"]) == 1

    # Supervisor unassigned cannot see or retrieve schedule (404)
    api_client.force_authenticate(user=supervisor_user)
    assert api_client.get(f"/api/schedules/{sched_id}/").status_code == status.HTTP_404_NOT_FOUND

    # Supervisor assigned can retrieve schedule
    SupervisorAssignment.objects.create(supervisor=supervisor_user, location=loc, is_active=True)
    assert api_client.get(f"/api/schedules/{sched_id}/").status_code == status.HTTP_200_OK
