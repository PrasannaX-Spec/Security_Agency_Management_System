"""DutySchedule model with overlap-validation index."""

from django.conf import settings
from django.db import models


class DutySchedule(models.Model):
    """A scheduled shift: guard + location + time window."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="schedules"
    )
    location = models.ForeignKey(
        "locations.Location", on_delete=models.CASCADE, related_name="schedules"
    )
    shift_start = models.DateTimeField()
    shift_end = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_schedules",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "duty_schedules"
        indexes = [
            models.Index(fields=["guard", "shift_start", "shift_end"]),
        ]

    def __str__(self):
        return f"{self.guard} @ {self.location} ({self.shift_start})"
