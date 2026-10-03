"""Location and SupervisorAssignment models."""

from django.conf import settings
from django.db import models


class Location(models.Model):
    """A site where guards are deployed."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_m = models.PositiveIntegerField(default=100)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "locations"

    def __str__(self):
        return self.name


class SupervisorAssignment(models.Model):
    """Links a supervisor user to a location they oversee."""

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="location_assignments",
    )
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name="supervisor_assignments"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "supervisor_assignments"
        unique_together = ("supervisor", "location")

    def __str__(self):
        return f"{self.supervisor.username} -> {self.location.name}"
