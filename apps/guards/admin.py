from django.contrib import admin
from .models import Guard, GuardDocument


@admin.register(Guard)
class GuardAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "id_number", "status", "joining_date")
    list_filter = ("status", "joining_date")
    search_fields = ("user__username", "user__first_name", "user__last_name", "id_number")


@admin.register(GuardDocument)
class GuardDocumentAdmin(admin.ModelAdmin):
    list_display = ("guard", "doc_type", "created_at")
    list_filter = ("doc_type",)
