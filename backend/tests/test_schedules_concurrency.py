"""Integration test verifying PostgreSQL row-level locking concurrency during schedule creation."""
import concurrent.futures
from datetime import timedelta
from django.db import connection, connections
from django.test import TransactionTestCase
from django.utils import timezone
import pytest

from apps.accounts.models import User
from apps.clients.models import Client
from apps.locations.models import Location, Post
from apps.guards.models import Guard
from apps.schedules.models import DutySchedule
from apps.schedules.services import ScheduleService
from apps.schedules.exceptions import ScheduleConflictError


class TestScheduleConcurrency(TransactionTestCase):
    def setUp(self):
        super().setUp()
        self.client_user = User.objects.create_user(
            username="concurrent_client",
            password="password123",
            role=User.Role.CLIENT,
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            company_name="Concurrency Corp",
            contact_person="Alice",
            email="alice@concurrency.com",
            phone="1234567890",
            address="123 Test St",
        )
        self.location = Location.objects.create(
            name="Concurrent Site",
            client=self.client_profile,
            address="123 Test St",
            latitude="17.44",
            longitude="78.37",
            radius_m=100,
        )
        self.post = Post.objects.create(
            location=self.location,
            name="Gate 1",
            required_guard_count=1,
        )
        self.guard_user = User.objects.create_user(
            username="concurrent_guard",
            password="password123",
            role=User.Role.GUARD,
        )
        self.guard = Guard.objects.create(
            user=self.guard_user,
            full_name="Concurrent Guard",
            phone="5551234567",
            id_number="CONC001",
            dob="1995-01-01",
            address="123 Guard St",
            experience_years=3,
            joining_date="2023-01-01",
        )

    def test_concurrent_booking_postgresql_lock(self):
        # Assert database vendor is postgresql
        self.assertEqual(
            connection.vendor,
            "postgresql",
            "Concurrency row-lock test must run against PostgreSQL",
        )

        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        shift_start = now + timedelta(days=1, hours=8)
        shift_end = now + timedelta(days=1, hours=16)

        results = []
        errors = []

        def book_shift():
            # In multi-threaded test, ensure fresh connection for thread
            db_conn = connections["default"]
            db_conn.connect()
            try:
                guard = Guard.objects.get(id=self.guard.id)
                post = Post.objects.get(id=self.post.id)
                location = Location.objects.get(id=self.location.id)
                client = Client.objects.get(id=self.client_profile.id)

                sched, warning = ScheduleService.create_schedule(
                    guard=guard,
                    post=post,
                    location=location,
                    client=client,
                    shift_start=shift_start,
                    shift_end=shift_end,
                )
                results.append(sched)
            except Exception as e:
                errors.append(e)
            finally:
                db_conn.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(book_shift), executor.submit(book_shift)]
            concurrent.futures.wait(futures)

        # One should succeed, one should raise ScheduleConflictError
        self.assertEqual(
            len(results),
            1,
            f"Expected 1 success, got {len(results)}. Errors: {errors}",
        )
        self.assertEqual(len(errors), 1, f"Expected 1 error, got {len(errors)}")
        self.assertIsInstance(errors[0], ScheduleConflictError)

        # Database must only have 1 active schedule for this guard
        schedules = DutySchedule.objects.filter(
            guard=self.guard, status=DutySchedule.Status.SCHEDULED
        )
        self.assertEqual(schedules.count(), 1)
