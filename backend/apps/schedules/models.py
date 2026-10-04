"""DutySchedule model with overlap-validation index."""

from django.conf import settings
from django.db import models


class DutySchedule(models.Model):
    """A scheduled shift: guard + client + location + post + time window."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="schedules"
    )
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="schedules"
    )
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.CASCADE,
        related_name="schedules",
        verbose_name="Site Location",
    )
    post = models.ForeignKey(
        "locations.Post", on_delete=models.CASCADE, related_name="schedules"
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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "duty_schedules"
        indexes = [
            models.Index(fields=["guard", "shift_start", "shift_end"], name="duty_sched_guard_time_idx"),
            models.Index(fields=["location", "shift_start"], name="duty_sched_loc_time_idx"),
            models.Index(fields=["status", "shift_start"], name="duty_sched_status_time_idx"),
        ]

    def __str__(self):
        return f"{self.guard} @ {self.location} ({self.shift_start})"
