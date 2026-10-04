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

    def test_client_login(self, api_client):
        from apps.accounts.models import User
        from apps.clients.models import Client

        client_user = User.objects.create_user(
            username="testclient", password="testpass123", role=User.Role.CLIENT
        )
        Client.objects.create(
            user=client_user,
            company_name="Test Corp",
            contact_person="John Doe",
            phone="1234567890",
            email="client@test.local",
        )
        resp = api_client.post(self.url, {"username": "testclient", "password": "testpass123"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["user"]["role"] == "CLIENT"

    def test_invalid_credentials(self, api_client, admin_user):
        resp = api_client.post(self.url, {"username": "testadmin", "password": "wrong"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json()["success"] is False

    def test_deactivated_all_roles_login(self, api_client):
        from apps.accounts.models import User

        for role in ["ADMIN", "SUPERVISOR", "GUARD", "CLIENT"]:
            u = User.objects.create_user(
                username=f"deactive_{role.lower()}",
                password="pass123",
                role=role,
                status=User.AccountStatus.INACTIVE,
            )
            resp = api_client.post(self.url, {"username": u.username, "password": "pass123"})
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
    """Guard & Client permission classes."""

    def test_guard_cannot_access_admin_endpoint(self, api_client, guard_user):
        from common.permissions import IsAdmin
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-admin-endpoint")
        request.user = guard_user
        perm = IsAdmin()
        assert perm.has_permission(request, None) is False

    def test_client_has_client_perm(self, api_client):
        from apps.accounts.models import User
        from common.permissions import IsClient
        from rest_framework.test import APIRequestFactory

        client_user = User.objects.create_user(
            username="client_user", password="password", role=User.Role.CLIENT
        )
        factory = APIRequestFactory()
        request = factory.get("/fake-client-endpoint")
        request.user = client_user
        perm = IsClient()
        assert perm.has_permission(request, None) is True

    def test_guard_cannot_pass_client_perm(self, api_client, guard_user):
        from common.permissions import IsClient
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/fake-client-endpoint")
        request.user = guard_user
        perm = IsClient()
        assert perm.has_permission(request, None) is False


# ---------------------------------------------------------------------------
# Supervisor & Client scoping tests
# ---------------------------------------------------------------------------

class TestClientAndSupervisorScoping:
    """Scoping helpers return correct location IDs for Supervisors and Clients."""

    def test_supervisor_sees_only_assigned_locations(
        self, supervisor_with_assignment, location_a, location_b
    ):
        from common.permissions import get_supervisor_location_ids

        loc_ids = get_supervisor_location_ids(supervisor_with_assignment)
        assert location_a.id in loc_ids
        assert location_b.id not in loc_ids

    def test_client_sees_only_owned_locations(self, api_client, location_a):
        from apps.accounts.models import User
        from apps.clients.models import Client
        from common.permissions import get_client_location_ids

        c_user = User.objects.create_user(
            username="corp_owner", password="pass", role=User.Role.CLIENT
        )
        client = Client.objects.create(
            user=c_user,
            company_name="Corp A",
            contact_person="Person A",
            phone="111",
            email="a@corp.com",
        )
        location_a.client = client
        location_a.save()

        loc_ids = get_client_location_ids(c_user)
        assert location_a.id in loc_ids


# ---------------------------------------------------------------------------
# Wage fields validation tests
# ---------------------------------------------------------------------------

class TestGuardWageFields:
    def test_wage_fields_decimal_safety(self, guard_user):
        from apps.guards.models import Guard
        from decimal import Decimal

        g = Guard.objects.create(
            user=guard_user,
            full_name="Test Guard",
            phone="9999999999",
            id_number="IDWAGE123",
            dob="1992-05-05",
            address="Test address",
            joining_date="2024-01-01",
            wage_type=Guard.WageType.HOURLY,
            wage_rate=Decimal("25.50"),
        )
        assert g.wage_rate == Decimal("25.50")
        assert g.wage_type == "HOURLY"


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

    def test_privacy_public(self, api_client):
        resp = api_client.get("/api/legal/privacy")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["data"]["title"] == "Privacy Policy"


# ---------------------------------------------------------------------------
# Token refresh deactivated user test
# ---------------------------------------------------------------------------

class TestTokenRefreshDeactivatedUser:
    url = "/api/auth/refresh"

    def test_refresh_blocked_when_deactivated(self, api_client, guard_user):
        login_resp = api_client.post("/api/auth/login", {"username": "testguard", "password": "testpass123"})
        assert login_resp.status_code == status.HTTP_200_OK
        refresh_token = login_resp.json()["data"]["refresh"]

        guard_user.status = "INACTIVE"
        guard_user.save()

        refresh_resp = api_client.post(self.url, {"refresh": refresh_token})
        assert refresh_resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert refresh_resp.json()["success"] is False


