"""Admin configuration for custom User model."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "availability_status",
    )
    list_filter = ("role", "is_active", "availability_status")
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Security System Role & Policy",
            {
                "fields": (
                    "role",
                    "availability_status",
                    "terms_accepted_at",
                    "privacy_accepted_at",
                    "terms_version",
                )
            },
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Security System Role",
            {"fields": ("role", "availability_status")},
        ),
    )
