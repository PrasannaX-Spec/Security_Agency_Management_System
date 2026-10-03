from django.contrib import admin
from .models import GuardLocation


@admin.register(GuardLocation)
class GuardLocationAdmin(admin.ModelAdmin):
    list_display = ("guard", "lat", "lng", "outside_geofence", "recorded_at")
    list_filter = ("outside_geofence", "recorded_at")
