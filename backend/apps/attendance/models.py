"""Attendance model for check-in/check-out records."""

from django.db import models


class Attendance(models.Model):
    """One attendance record per scheduled shift."""

    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        LATE = "LATE", "Late"
        ABSENT = "ABSENT", "Absent"

    schedule = models.OneToOneField(
        "schedules.DutySchedule",
        on_delete=models.CASCADE,
        related_name="attendance_record",
    )
    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="attendance_records"
    )
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ABSENT
    )
    check_in_lat = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    check_in_lng = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendance"
        indexes = [
            models.Index(fields=["guard", "schedule"]),
        ]
        verbose_name_plural = "attendance records"

    def __str__(self):
        return f"{self.guard} - {self.status}"
