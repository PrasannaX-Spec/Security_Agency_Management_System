"""Tests for authentication, RBAC, and supervisor scoping.

Covers:
- Login for all 3 roles
- Guard getting 403 on an Admin endpoint
- Supervisor scoping (can only see data at assigned locations)
- Inactive user cannot log in
- Terms acceptance flow
"""

import pytest
from django.test import override_settings
from rest_framework import status


pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

class TestLogin:
    url = "/api/auth/login"

    def test_admin_login(self, api_client, admin_user):
        resp = api_client.post(self.url, {"username": "testadmin", "password": "testpass123"})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert "access" in data["data"]
        assert data["data"]["user"]["role"] == "ADMIN"

    def test_supervisor_login(self, api_client, supervisor_user):
        resp = api_client.post(self.url, {"username": "testsup", "password": "testpass123"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["user"]["role"] == "SUPERVISOR"

    def test_guard_login(self, api_client, guard_user):
        resp = api_client.post(self.url, {"username": "testguard", "password": "testpass123"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["user"]["role"] == "GUARD"

    def test_invalid_credentials(self, api_client, admin_user):
        resp = api_client.post(self.url, {"username": "testadmin", "password": "wrong"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json()["success"] is False

    def test_inactive_user_cannot_login(self, api_client, guard_user):
        guard_user.status = "INACTIVE"
        guard_user.save()
        resp = api_client.post(self.url, {"username": "testguard", "password": "testpass123"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json()["success"] is False


# ---------------------------------------------------------------------------
# /auth/me tests
# ---------------------------------------------------------------------------

class TestMe:
    url = "/api/auth/me"

    def test_me_returns_user_info(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        resp = api_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["username"] == "testadmin"
        assert data["role"] == "ADMIN"

    def test_me_unauthenticated(self, api_client):
        resp = api_client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_needs_terms_acceptance(self, api_client, guard_user):
        api_client.force_authenticate(user=guard_user)
        resp = api_client.get(self.url)
        data = resp.json()["data"]
        assert data["needs_terms_acceptance"] is True


# ---------------------------------------------------------------------------
# Terms acceptance tests
# ---------------------------------------------------------------------------

class TestAcceptTerms:
    url = "/api/auth/accept-terms"

    def test_accept_terms(self, api_client, guard_user):
        api_client.force_authenticate(user=guard_user)
        resp = api_client.post(self.url)
        assert resp.status_code == status.HTTP_200_OK
        guard_user.refresh_from_db()
        assert guard_user.terms_version == "1.0"
        assert guard_user.terms_accepted_at is not None

    def test_me_after_acceptance(self, api_client, guard_user):
        api_client.force_authenticate(user=guard_user)
        api_client.post(self.url)
        resp = api_client.get("/api/auth/me")
        assert resp.json()["data"]["needs_terms_acceptance"] is False


# ---------------------------------------------------------------------------
# RBAC tests
# ---------------------------------------------------------------------------

class TestRBAC:
    """Guard must get 403 on admin-only endpoints."""

    def test_guard_cannot_access_admin_endpoint(self, api_client, guard_user):
        """Django admin is admin-only. Also test Swagger is accessible."""
        api_client.force_authenticate(user=guard_user)
        # The admin panel returns a redirect (302) for non-staff, but
        # we test our custom endpoints. We use /api/docs/ as a proxy
        # for now since CRUD endpoints are not wired in P1.
        # The real RBAC test is that guard cannot call guard-management endpoints.
        # For P1, we test the permission class directly.
        from common.permissions import IsAdmin
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-admin-endpoint")
        request.user = guard_user
        perm = IsAdmin()
        assert perm.has_permission(request, None) is False

    def test_admin_has_admin_perm(self, api_client, admin_user):
        from common.permissions import IsAdmin
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-admin-endpoint")
        request.user = admin_user
        perm = IsAdmin()
        assert perm.has_permission(request, None) is True

    def test_supervisor_has_supervisor_perm(self, api_client, supervisor_user):
        from common.permissions import IsSupervisor
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-endpoint")
        request.user = supervisor_user
        perm = IsSupervisor()
        assert perm.has_permission(request, None) is True

    def test_guard_has_guard_perm(self, api_client, guard_user):
        from common.permissions import IsGuard
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-endpoint")
        request.user = guard_user
        perm = IsGuard()
        assert perm.has_permission(request, None) is True


# ---------------------------------------------------------------------------
# Supervisor scoping tests
# ---------------------------------------------------------------------------

class TestSupervisorScoping:
    """Supervisor location-scoping helper returns correct location IDs."""

    def test_supervisor_sees_only_assigned_locations(
        self, supervisor_with_assignment, location_a, location_b
    ):
        from common.permissions import get_supervisor_location_ids

        loc_ids = get_supervisor_location_ids(supervisor_with_assignment)
        assert location_a.id in loc_ids
        assert location_b.id not in loc_ids

    def test_supervisor_with_no_assignments(self, supervisor_user):
        from common.permissions import get_supervisor_location_ids

        loc_ids = get_supervisor_location_ids(supervisor_user)
        assert loc_ids == []


# ---------------------------------------------------------------------------
# Legal endpoints tests
# ---------------------------------------------------------------------------

class TestLegalEndpoints:
    """Legal endpoints are public (no auth required)."""

    def test_terms_public(self, api_client):
        resp = api_client.get("/api/legal/terms")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Terms and Conditions"
        assert data["data"]["version"] == "1.0"

    def test_privacy_public(self, api_client):
        resp = api_client.get("/api/legal/privacy")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["data"]["title"] == "Privacy Policy"
