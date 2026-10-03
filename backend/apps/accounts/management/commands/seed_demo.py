"""Management command to seed the database with demo data.

Creates 1 admin, 2 supervisors, 15 guards with profiles, 5 locations,
supervisor assignments, and a week of shifts.

Safety: refuses to run when DEBUG=False unless --force is passed.
"""

from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import User
from apps.guards.models import Guard
from apps.locations.models import Location, SupervisorAssignment
from apps.schedules.models import DutySchedule


class Command(BaseCommand):
    help = "Seed the database with demo data for development and demos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow seeding even when DEBUG=False.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                "Refusing to seed: DEBUG is False. "
                "Pass --force to override."
            )

        self.stdout.write("Clearing existing demo data...")
        GuardRequest = None
        try:
            from apps.requests.models import GuardRequest as GR
            GuardRequest = GR
        except ImportError:
            pass

        DutySchedule.objects.all().delete()
        SupervisorAssignment.objects.all().delete()
        Guard.objects.all().delete()
        Location.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write("Creating users...")
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@agency.local",
            password="admin123",
            role=User.Role.ADMIN,
        )

        sup1 = User.objects.create_user(
            username="supervisor1",
            email="sup1@agency.local",
            password="super123",
            role=User.Role.SUPERVISOR,
            availability_status=User.AvailabilityStatus.AVAILABLE,
        )
        sup2 = User.objects.create_user(
            username="supervisor2",
            email="sup2@agency.local",
            password="super123",
            role=User.Role.SUPERVISOR,
            availability_status=User.AvailabilityStatus.AVAILABLE,
        )

        guard_names = [
            ("Ravi Kumar", "9800000001", "ID001"),
            ("Suresh Reddy", "9800000002", "ID002"),
            ("Anil Sharma", "9800000003", "ID003"),
            ("Vijay Singh", "9800000004", "ID004"),
            ("Ramesh Patil", "9800000005", "ID005"),
            ("Kiran Rao", "9800000006", "ID006"),
            ("Deepak Verma", "9800000007", "ID007"),
            ("Manoj Gupta", "9800000008", "ID008"),
            ("Sanjay Yadav", "9800000009", "ID009"),
            ("Arjun Nair", "9800000010", "ID010"),
            ("Prasad Joshi", "9800000011", "ID011"),
            ("Naveen Das", "9800000012", "ID012"),
            ("Ganesh Pillai", "9800000013", "ID013"),
            ("Harish Menon", "9800000014", "ID014"),
            ("Rajesh Iyer", "9800000015", "ID015"),
        ]

        guards = []
        for i, (name, phone, id_num) in enumerate(guard_names, start=1):
            user = User.objects.create_user(
                username=f"guard{i:02d}",
                email=f"guard{i:02d}@agency.local",
                password="guard123",
                role=User.Role.GUARD,
            )
            guard = Guard.objects.create(
                user=user,
                full_name=name,
                phone=phone,
                id_number=id_num,
                dob="1990-01-15",
                address=f"Guard quarters, Block {chr(64 + (i % 5) + 1)}",
                experience_years=(i % 10),
                joining_date="2024-01-01",
            )
            guards.append(guard)

        self.stdout.write("Creating locations...")
        locations_data = [
            ("Tech Park Main Gate", "HITEC City, Hyderabad", "17.4435", "78.3772"),
            ("Sunrise Apartments Complex", "Kukatpally, Hyderabad", "17.4948", "78.3996"),
            ("Central Business Tower", "Madhapur, Hyderabad", "17.4400", "78.3489"),
            ("Industrial Warehouse Zone", "Patancheru, Hyderabad", "17.5326", "78.2648"),
            ("City Mall Entrance", "Gachibowli, Hyderabad", "17.4401", "78.3489"),
        ]

        locations = []
        for name, address, lat, lng in locations_data:
            loc = Location.objects.create(
                name=name,
                address=address,
                latitude=lat,
                longitude=lng,
                radius_m=100,
            )
            locations.append(loc)

        self.stdout.write("Assigning supervisors to locations...")
        for loc in locations[:3]:
            SupervisorAssignment.objects.create(supervisor=sup1, location=loc)
        for loc in locations[2:]:
            SupervisorAssignment.objects.create(supervisor=sup2, location=loc)

        self.stdout.write("Creating a week of shifts...")
        now = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = now - timedelta(days=now.weekday())

        for day_offset in range(7):
            day = start_of_week + timedelta(days=day_offset)
            for idx, guard in enumerate(guards):
                loc = locations[idx % len(locations)]
                # Day shift: 08:00 - 20:00
                DutySchedule.objects.create(
                    guard=guard,
                    location=loc,
                    shift_start=day + timedelta(hours=8),
                    shift_end=day + timedelta(hours=20),
                    status=DutySchedule.Status.SCHEDULED,
                    created_by=admin,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded: 1 admin, 2 supervisors, {len(guards)} guards, "
                f"{len(locations)} locations, "
                f"{DutySchedule.objects.count()} shifts."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Credentials: admin/admin123, supervisor1/super123, "
                "supervisor2/super123, guard01..guard15/guard123"
            )
        )
