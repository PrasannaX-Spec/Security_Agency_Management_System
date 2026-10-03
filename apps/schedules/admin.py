from django.contrib import admin
from .models import DutySchedule


@admin.register(DutySchedule)
class DutyScheduleAdmin(admin.ModelAdmin):
    list_display = ("guard", "location", "shift_start", "shift_end", "status")
    list_filter = ("status", "location")
    search_fields = ("guard__user__first_name", "guard__user__last_name", "location__name")
