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


class IsClient(BasePermission):
    """Allow access only to users with the CLIENT role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CLIENT"


class IsGuard(BasePermission):
    """Allow access only to users with the GUARD role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "GUARD"


class IsAdminOrSupervisor(BasePermission):

    """Allow access to ADMIN or SUPERVISOR roles."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["ADMIN", "SUPERVISOR"]


# ---------------------------------------------------------------------------
# Queryset-scoping helpers
# ---------------------------------------------------------------------------

def get_supervisor_location_ids(user):
    """Return a flat list of active location IDs assigned to *user* (a supervisor).

    Import is deferred to avoid circular imports at module level.
    """
    from apps.locations.models import SupervisorAssignment

    return list(
        SupervisorAssignment.objects.filter(supervisor=user, is_active=True).values_list(
            "location_id", flat=True
        )
    )


def get_client_location_ids(user):
    """Return a flat list of location IDs owned by *user* (a client)."""
    from apps.locations.models import Location

    if not hasattr(user, "client_profile") or not user.client_profile:
        return []
    return list(
        Location.objects.filter(client=user.client_profile, status="ACTIVE").values_list(
            "id", flat=True
        )
    )

