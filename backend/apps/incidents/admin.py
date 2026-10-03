from django.contrib import admin
from .models import Incident


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("title", "guard", "location", "severity", "status", "created_at")
    list_filter = ("severity", "status", "created_at")
    search_fields = ("title", "description", "guard__user__first_name")
