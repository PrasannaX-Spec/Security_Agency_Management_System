"""Tests for Phase 3 Master Data Management APIs and Scoping."""

import pytest
from rest_framework import status
from apps.accounts.models import User, SupervisorProfile
from apps.clients.models import Client
from apps.guards.models import Guard
from apps.locations.models import Location, Post, SupervisorAssignment

pytestmark = pytest.mark.django_db


class TestGuardManagement:
    url = "/api/guards/"

    def test_admin_can_list_guards(self, api_client, admin_user, guard_user):
        api_client.force_authenticate(user=admin_user)
        Guard.objects.create(
            user=guard_user,
            full_name="Guard Test",
            phone="9000000001",
            id_number="IDG999",
            dob="1995-01-01",
            address="Street 1",
            joining_date="2024-01-01",
        )
        resp = api_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["success"] is True

    def test_admin_can_create_guard(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        payload = {
            "username": "newguard01",
            "email": "newguard01@agency.local",
            "password": "guardpass123",
            "full_name": "New Guard One",
            "phone": "9876543210",
            "id_number": "IDNEW001",
            "dob": "1994-06-15",
            "address": "Hyderabad Sector 4",
            "experience_years": 3,
            "joining_date": "2024-02-01",
            "wage_type": "DAILY",
            "wage_rate": "160.00",
        }
        resp = api_client.post(self.url, payload)
        assert resp.status_code == status.HTTP_201_CREATED
        assert Guard.objects.filter(id_number="IDNEW001").exists()
        assert User.objects.filter(username="newguard01").exists()

    def test_admin_deactivate_guard(self, api_client, admin_user, guard_user):
        api_client.force_authenticate(user=admin_user)
        g = Guard.objects.create(
            user=guard_user,
            full_name="Guard Test Deactivate",
            phone="9000000002",
            id_number="IDG998",
            dob="1995-01-01",
            address="Street 1",
            joining_date="2024-01-01",
        )
        resp = api_client.patch(f"{self.url}{g.id}/deactivate/")
        assert resp.status_code == status.HTTP_200_OK
        g.refresh_from_db()
        assert g.status == "INACTIVE"
        assert g.user.status == "INACTIVE"

    def test_guard_cannot_access_guard_list(self, api_client, guard_user):
        api_client.force_authenticate(user=guard_user)
        resp = api_client.get(self.url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN


class TestClientManagement:
    url = "/api/clients/"

    def test_admin_create_client(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        payload = {
            "company_name": "Acme Global Corp",
            "contact_person": "Robert Vance",
            "phone": "9811223344",
            "email": "robert@acmeglobal.local",
            "address": "Financial District, Hyderabad",
        }
        resp = api_client.post(self.url, payload)
        assert resp.status_code == status.HTTP_201_CREATED
        assert Client.objects.filter(email="robert@acmeglobal.local").exists()

    def test_client_status_toggle(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        c_user = User.objects.create_user(username="client_user_st", password="pass", role=User.Role.CLIENT)
        client = Client.objects.create(
            user=c_user,
            company_name="Toggle Corp",
            contact_person="Contact T",
            phone="999",
            email="toggle@corp.local",
        )
        resp = api_client.patch(f"{self.url}{client.id}/status/", {"status": "INACTIVE"})
        assert resp.status_code == status.HTTP_200_OK
        client.refresh_from_db()
        assert client.status == "INACTIVE"
        assert client.user.status == "INACTIVE"


class TestSiteAndPostManagement:
    sites_url = "/api/sites/"
    posts_url = "/api/posts/"

    def test_coordinate_validation(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        payload = {
            "name": "Invalid Lat Site",
            "address": "Somewhere",
            "latitude": "120.000000",
            "longitude": "78.000000",
            "radius_m": 100,
        }
        resp = api_client.post(self.sites_url, payload)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_geofence_radius_validation(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        payload = {
            "name": "Invalid Radius Site",
            "address": "Somewhere",
            "latitude": "17.443500",
            "longitude": "78.377200",
            "radius_m": 0,
        }
        resp = api_client.post(self.sites_url, payload)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_guard_count_validation(self, api_client, admin_user, location_a):
        api_client.force_authenticate(user=admin_user)
        payload = {
            "name": "Gate 1",
            "location": location_a.id,
            "required_guard_count": 0,
        }
        resp = api_client.post(self.posts_url, payload)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestSupervisorSiteAssignment:
    url = "/api/supervisors/"

    def test_assign_sites_to_supervisor(self, api_client, admin_user, supervisor_user, location_a, location_b):
        api_client.force_authenticate(user=admin_user)
        SupervisorProfile.objects.get_or_create(user=supervisor_user)
        payload = {"location_ids": [location_a.id, location_b.id]}
        resp = api_client.post(f"{self.url}{supervisor_user.id}/assign-sites/", payload)
        assert resp.status_code == status.HTTP_200_OK
        assignments = SupervisorAssignment.objects.filter(supervisor=supervisor_user, is_active=True)
        assert assignments.count() == 2
