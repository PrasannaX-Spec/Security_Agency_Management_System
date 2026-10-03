"""GuardLocation model for GPS pings."""

from django.db import models


class GuardLocation(models.Model):
    """A single GPS ping from a guard during an active shift."""

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="location_pings"
    )
    schedule = models.ForeignKey(
        "schedules.DutySchedule",
        on_delete=models.CASCADE,
        related_name="location_pings",
        null=True,
        blank=True,
    )
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lng = models.DecimalField(max_digits=9, decimal_places=6)
    outside_geofence = models.BooleanField(default=False)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "guard_locations"
        indexes = [
            models.Index(fields=["guard", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.guard} @ ({self.lat}, {self.lng})"
