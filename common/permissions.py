"""DRF permission classes for RBAC and queryset-scoping helpers."""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with the ADMIN role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class IsSupervisor(BasePermission):
    """Allow access only to users with the SUPERVISOR role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "SUPERVISOR"


class IsGuard(BasePermission):
    """Allow access only to users with the GUARD role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "GUARD"


# ---------------------------------------------------------------------------
# Queryset-scoping helpers
# ---------------------------------------------------------------------------

def get_supervisor_location_ids(user):
    """Return a flat list of location IDs assigned to *user* (a supervisor).

    Import is deferred to avoid circular imports at module level.
    """
    from apps.locations.models import SupervisorAssignment

    return list(
        SupervisorAssignment.objects.filter(supervisor=user).values_list(
            "location_id", flat=True
        )
    )
