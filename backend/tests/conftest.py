"""Shared pytest fixtures for the test suite."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.clients.models import Client
from apps.guards.models import Guard
from apps.locations.models import Location, Post, SupervisorAssignment


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="testadmin",
        email="admin@test.local",
        password="testpass123",
        role=User.Role.ADMIN,
    )


@pytest.fixture
def supervisor_user(db):
    return User.objects.create_user(
        username="testsup",
        email="sup@test.local",
        password="testpass123",
        role=User.Role.SUPERVISOR,
    )


@pytest.fixture
def guard_user(db):
    return User.objects.create_user(
        username="testguard",
        email="guard@test.local",
        password="testpass123",
        role=User.Role.GUARD,
    )


@pytest.fixture
def guard_profile(guard_user):
    return Guard.objects.create(
        user=guard_user,
        full_name="Test Guard",
        phone="9999999999",
        id_number="TESTID001",
        dob="1995-06-15",
        address="Test address",
        experience_years=2,
        joining_date="2024-01-01",
    )


@pytest.fixture
def location_a(db):
    return Location.objects.create(
        name="Location A",
        address="Test address A",
        latitude="17.4435",
        longitude="78.3772",
        radius_m=100,
    )


@pytest.fixture
def location_b(db):
    return Location.objects.create(
        name="Location B",
        address="Test address B",
        latitude="17.4948",
        longitude="78.3996",
        radius_m=100,
    )


@pytest.fixture
def supervisor_with_assignment(supervisor_user, location_a):
    SupervisorAssignment.objects.create(
        supervisor=supervisor_user, location=location_a
    )
    return supervisor_user


@pytest.fixture
def schedule_setup(db, guard_profile, admin_user):
    client = Client.objects.create(
        company_name="Metro Corp",
        contact_person="Bob",
        phone="2223334444",
        email="bob@metro.local",
        user=admin_user,
    )
    loc = Location.objects.create(
        name="Metro Yard",
        client=client,
        address="100 Metro Rd",
        latitude="17.44",
        longitude="78.37",
        radius_m=100,
    )
    post = Post.objects.create(name="Entry Gate", location=loc, required_guard_count=1)
    return client, loc, post, guard_profile, admin_user
