from django.contrib import admin
from .models import Location, SupervisorAssignment


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "latitude", "longitude", "radius_m", "status")
    list_filter = ("status",)
    search_fields = ("name", "address")


@admin.register(SupervisorAssignment)
class SupervisorAssignmentAdmin(admin.ModelAdmin):
    list_display = ("supervisor", "location", "created_at")
    list_filter = ("location",)
