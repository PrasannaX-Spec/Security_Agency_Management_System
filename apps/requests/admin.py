from django.contrib import admin
from .models import GuardRequest


@admin.register(GuardRequest)
class GuardRequestAdmin(admin.ModelAdmin):
    list_display = ("guard", "request_type", "status", "location", "created_at")
    list_filter = ("status", "request_type", "location")
