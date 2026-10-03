"""Incident model for guard-filed reports."""

from django.db import models


class Incident(models.Model):
    """An incident report filed by a guard."""

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        REVIEWED = "REVIEWED", "Reviewed"

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="incidents"
    )
    location = models.ForeignKey(
        "locations.Location", on_delete=models.CASCADE, related_name="incidents"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=Severity.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "incidents"

    def __str__(self):
        return f"{self.title} ({self.severity})"
