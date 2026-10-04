"""Guard and GuardDocument models."""

from django.conf import settings
from django.db import models


class Guard(models.Model):
    """Guard profile linked 1:1 to a User with role=GUARD."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    class WageType(models.TextChoices):
        DAILY = "DAILY", "Daily"
        HOURLY = "HOURLY", "Hourly"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="guard_profile",
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    id_number = models.CharField(max_length=50, unique=True)
    dob = models.DateField()
    address = models.TextField()
    experience_years = models.PositiveIntegerField(default=0)
    joining_date = models.DateField()
    wage_type = models.CharField(
        max_length=20,
        choices=WageType.choices,
        default=WageType.DAILY,
    )
    wage_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guards"

    def __str__(self):
        return self.full_name


class GuardDocument(models.Model):
    """Optional document records attached to a guard."""

    guard = models.ForeignKey(
        Guard, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=50)
    doc_number = models.CharField(max_length=100)
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guard_documents"

    def __str__(self):
        return f"{self.doc_type} - {self.guard.full_name}"
