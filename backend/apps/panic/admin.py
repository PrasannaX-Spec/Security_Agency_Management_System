from django.contrib import admin
from .models import PanicAlert


@admin.register(PanicAlert)
class PanicAlertAdmin(admin.ModelAdmin):
    list_display = ("guard", "status", "handled_by", "created_at")
    list_filter = ("status", "created_at")
