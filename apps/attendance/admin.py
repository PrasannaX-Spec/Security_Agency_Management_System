from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("guard", "schedule", "status", "check_in", "check_out")
    list_filter = ("status", "check_in")
