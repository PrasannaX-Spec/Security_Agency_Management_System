"""GuardRequest model for predefined quick requests between guards and supervisors."""

from django.conf import settings
from django.db import models


class GuardRequest(models.Model):
    """A predefined request from a guard to a supervisor."""

    class RequestType(models.TextChoices):
        SUPERVISOR_AVAILABLE = "SUPERVISOR_AVAILABLE", "Is a supervisor available?"
        RELIEF_BREAK = "RELIEF_BREAK", "Need relief / break"
        BACKUP = "BACKUP", "Need backup (non-emergency)"
        EQUIPMENT_SITE_ISSUE = "EQUIPMENT_SITE_ISSUE", "Equipment or site issue"
        SCHEDULE_QUERY = "SCHEDULE_QUERY", "Schedule query"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        REPLIED = "REPLIED", "Replied"
        RESOLVED = "RESOLVED", "Resolved"

    class ResponseOption(models.TextChoices):
        ON_MY_WAY = "ON_MY_WAY", "On my way"
        PLEASE_WAIT = "PLEASE_WAIT", "Please wait"
        APPROVED = "APPROVED", "Approved"
        CALL_ME = "CALL_ME", "Call me"
        DECLINED = "DECLINED", "Declined"

    guard = models.ForeignKey(
        "guards.Guard", on_delete=models.CASCADE, related_name="guard_requests"
    )
    schedule = models.ForeignKey(
        "schedules.DutySchedule",
        on_delete=models.CASCADE,
        related_name="guard_requests",
        null=True,
        blank=True,
    )
    location = models.ForeignKey(
        "locations.Location", on_delete=models.CASCADE, related_name="guard_requests"
    )
    request_type = models.CharField(max_length=30, choices=RequestType.choices)
    note = models.CharField(max_length=200, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    response_option = models.CharField(
        max_length=20, choices=ResponseOption.choices, blank=True, default=""
    )
    response_note = models.CharField(max_length=200, blank=True, default="")
    eta_minutes = models.PositiveIntegerField(null=True, blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_guard_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "guard_requests"
        indexes = [
            models.Index(fields=["location", "status"]),
        ]

    def __str__(self):
        return f"{self.guard} - {self.request_type} ({self.status})"
