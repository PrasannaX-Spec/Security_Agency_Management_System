"""Custom User model - must exist before the first migration."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with role, availability, and terms-consent fields."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        SUPERVISOR = "SUPERVISOR", "Supervisor"
        GUARD = "GUARD", "Guard"
        CLIENT = "CLIENT", "Client"

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BUSY = "BUSY", "Busy"
        OFF_DUTY = "OFF_DUTY", "Off Duty"

    class AccountStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    role = models.CharField(max_length=20, choices=Role.choices)
    availability_status = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
        blank=True,
    )
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    terms_version = models.CharField(max_length=10, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
    )

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.role})"


class SupervisorProfile(models.Model):
    """Supervisor profile details linked to the custom User model."""

    class AccountStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BUSY = "BUSY", "Busy"
        OFF_DUTY = "OFF_DUTY", "Off Duty"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="supervisor_profile",
    )
    phone = models.CharField(max_length=20, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
    )
    availability = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supervisor_profiles"

    def __str__(self):
        return f"Supervisor Profile: {self.user.username}"

