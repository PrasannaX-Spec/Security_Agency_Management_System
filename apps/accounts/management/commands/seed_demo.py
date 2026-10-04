"""Management command to seed the database with demo data.

Creates 1 admin, 2 supervisors, 15 guards with profiles, 5 locations,
supervisor assignments, and a week of shifts.

Safety: refuses to run when DEBUG=False unless --force is passed.
"""

from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import User, SupervisorProfile
from apps.clients.models import Client
from apps.guards.models import Guard
from apps.locations.models import Location, Post, SupervisorAssignment
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
        Post.objects.all().delete()
        Guard.objects.all().delete()
        Location.objects.all().delete()
        Client.objects.all().delete()
        SupervisorProfile.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write("Creating users & client accounts...")
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
        SupervisorProfile.objects.create(
            user=sup1,
            phone="9876543210",
            status=SupervisorProfile.AccountStatus.ACTIVE,
            availability=SupervisorProfile.AvailabilityStatus.AVAILABLE,
        )

        sup2 = User.objects.create_user(
            username="supervisor2",
            email="sup2@agency.local",
            password="super123",
            role=User.Role.SUPERVISOR,
            availability_status=User.AvailabilityStatus.AVAILABLE,
        )
        SupervisorProfile.objects.create(
            user=sup2,
            phone="9876543211",
            status=SupervisorProfile.AccountStatus.ACTIVE,
            availability=SupervisorProfile.AvailabilityStatus.AVAILABLE,
        )

        client1_user = User.objects.create_user(
            username="client1",
            email="contact@metromall.local",
            password="client123",
            role=User.Role.CLIENT,
        )
        client1 = Client.objects.create(
            user=client1_user,
            company_name="Metro Mall Corporation",
            contact_person="Anita Roy",
            phone="9800112233",
            email="contact@metromall.local",
            address="Plot 45, Gachibowli Financial District, Hyderabad",
            status=Client.Status.ACTIVE,
        )

        client2_user = User.objects.create_user(
            username="client2",
            email="info@apexhealth.local",
            password="client123",
            role=User.Role.CLIENT,
        )
        client2 = Client.objects.create(
            user=client2_user,
            company_name="Apex Health Group",
            contact_person="Dr. K. V. Sharma",
            phone="9800445566",
            email="info@apexhealth.local",
            address="Road No 12, Banjara Hills, Hyderabad",
            status=Client.Status.ACTIVE,
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
            is_hourly = (i % 3 == 0)
            guard = Guard.objects.create(
                user=user,
                full_name=name,
                phone=phone,
                id_number=id_num,
                dob="1990-01-15",
                address=f"Guard quarters, Block {chr(64 + (i % 5) + 1)}",
                experience_years=(i % 10),
                joining_date="2024-01-01",
                wage_type=Guard.WageType.HOURLY if is_hourly else Guard.WageType.DAILY,
                wage_rate="22.50" if is_hourly else "150.00",
            )
            guards.append(guard)

        self.stdout.write("Creating locations & posts...")
        locations_data = [
            ("Tech Park Main Gate", client1, "HITEC City, Hyderabad", "17.4435", "78.3772"),
            ("Sunrise Apartments Complex", client1, "Kukatpally, Hyderabad", "17.4948", "78.3996"),
            ("Central Business Tower", client1, "Madhapur, Hyderabad", "17.4400", "78.3489"),
            ("Industrial Warehouse Zone", client2, "Patancheru, Hyderabad", "17.5326", "78.2648"),
            ("City Mall Entrance", client2, "Gachibowli, Hyderabad", "17.4401", "78.3489"),
        ]

        locations = []
        for name, client_obj, address, lat, lng in locations_data:
            loc = Location.objects.create(
                name=name,
                client=client_obj,
                address=address,
                latitude=lat,
                longitude=lng,
                radius_m=100,
            )
            locations.append(loc)

            # Create 2 posts per location
            Post.objects.create(
                name="Main Entrance Gate",
                location=loc,
                required_guard_count=2,
            )
            Post.objects.create(
                name="Visitor Control Post",
                location=loc,
                required_guard_count=1,
            )

        self.stdout.write("Assigning supervisors to locations...")
        for loc in locations[:3]:
            SupervisorAssignment.objects.create(supervisor=sup1, location=loc, is_active=True)
        for loc in locations[2:]:
            SupervisorAssignment.objects.create(supervisor=sup2, location=loc, is_active=True)

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

        # Verify no overlapping shifts exist (PRD audit requirement).
        from django.db.models import Q

        overlap_count = 0
        for schedule in DutySchedule.objects.all():
            overlaps = DutySchedule.objects.filter(
                guard=schedule.guard,
                shift_start__lt=schedule.shift_end,
                shift_end__gt=schedule.shift_start,
                status=DutySchedule.Status.SCHEDULED,
            ).exclude(pk=schedule.pk)
            overlap_count += overlaps.count()

        if overlap_count > 0:
            self.stderr.write(
                self.style.ERROR(
                    f"Overlap check failed: {overlap_count} overlapping shift pairs found."
                )
            )
        else:
            self.stdout.write("Overlap check passed: 0 conflicts in seeded shifts.")

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded: 1 admin, 2 supervisors, 2 clients, {len(guards)} guards, "
                f"{len(locations)} locations ({Post.objects.count()} posts), "
                f"{DutySchedule.objects.count()} shifts."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Credentials: admin/admin123, supervisor1/super123, "
                "client1/client123, client2/client123, guard01..guard15/guard123"
            )
        )

