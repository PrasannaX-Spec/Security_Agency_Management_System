"""PanicAlert model for emergency alerts from guards."""

from django.conf import settings
from django.db import models


class PanicAlert(models.Model):
    """An emergency alert created by a guard with their GPS position."""

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        RESOLVED = "RESOLVED", "Resolved"

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="panic_alerts"
    )
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lng = models.DecimalField(max_digits=9, decimal_places=6)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_panic_alerts",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "panic_alerts"

    def __str__(self):
        return f"Panic by {self.guard} ({self.status})"
