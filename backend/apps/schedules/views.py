from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from django.core.exceptions import ValidationError
from common.permissions import (
    IsAdminOrSupervisor,
    IsClient,
    IsGuard,
    get_supervisor_location_ids,
    get_client_location_ids,
)

from apps.accounts.models import User
from apps.schedules.models import DutySchedule
from apps.schedules.serializers import DutyScheduleSerializer, DutyScheduleCreateUpdateSerializer
from apps.schedules.services import ScheduleService
from apps.schedules.exceptions import ScheduleConflictError
from common.pagination import StandardResultsSetPagination


class ScheduleListCreateView(generics.ListCreateAPIView):
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.GUARD:
            return DutySchedule.objects.none()

        qs = DutySchedule.objects.select_related("guard", "client", "location", "post").order_by("-shift_start")

        # Enforce server-side role scoping
        if user.role == User.Role.SUPERVISOR:
            allowed_locs = get_supervisor_location_ids(user)
            qs = qs.filter(location_id__in=allowed_locs)
        elif user.role == User.Role.CLIENT:
            allowed_locs = get_client_location_ids(user)
            qs = qs.filter(location_id__in=allowed_locs)

        # Filters
        client_id = self.request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)

        location_id = self.request.query_params.get("location_id")
        if location_id:
            qs = qs.filter(location_id=location_id)

        post_id = self.request.query_params.get("post_id")
        if post_id:
            qs = qs.filter(post_id=post_id)

        guard_id = self.request.query_params.get("guard_id")
        if guard_id:
            qs = qs.filter(guard_id=guard_id)

        status_val = self.request.query_params.get("status")
        if status_val:
            qs = qs.filter(status=status_val)

        date_val = self.request.query_params.get("date")
        if date_val:
            qs = qs.filter(shift_start__date=date_val)

        return qs

    def list(self, request, *args, **kwargs):
        if request.user.role == User.Role.GUARD:
            return Response(
                {"success": False, "data": None, "error": {"code": "FORBIDDEN", "message": "Guards must access /api/schedules/my/."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DutyScheduleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DutyScheduleSerializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data, "error": None})

    def create(self, request, *args, **kwargs):
        serializer = DutyScheduleCreateUpdateSerializer(data=request.data, context={"request_user": request.user})
        if not serializer.is_valid():
            return Response({"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "details": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce supervisor assignment boundary on creation
        if request.user.role == User.Role.SUPERVISOR:
            allowed_locs = get_supervisor_location_ids(request.user)
            if serializer.validated_data["location"].id not in allowed_locs:
                return Response({"success": False, "data": None, "error": {"code": "FORBIDDEN", "message": "You cannot schedule shifts for an unassigned site."}}, status=status.HTTP_403_FORBIDDEN)

        try:
            instance = serializer.save()
            warning = getattr(serializer, "advisory_warning", None)
            data = DutyScheduleSerializer(instance).data
            return Response({"success": True, "data": {"schedule": data, "warning": warning}, "error": None}, status=status.HTTP_201_CREATED)
        except ScheduleConflictError as e:
            conflict_data = None
            if e.conflicting_schedule:
                conflict_data = {
                    "id": e.conflicting_schedule.id,
                    "shift_start": e.conflicting_schedule.shift_start.isoformat(),
                    "shift_end": e.conflicting_schedule.shift_end.isoformat(),
                    "location_name": e.conflicting_schedule.location.name,
                    "post_name": e.conflicting_schedule.post.name,
                }
            return Response(
                {"success": False, "data": None, "error": {"code": "SCHEDULE_CONFLICT", "message": e.message, "conflicting_schedule": conflict_data}},
                status=status.HTTP_409_CONFLICT,
            )
        except ValidationError as e:
            return Response({"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)


class ScheduleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = DutyScheduleSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.GUARD:
            return DutySchedule.objects.none()

        qs = DutySchedule.objects.select_related("guard", "client", "location", "post")
        if user.role == User.Role.SUPERVISOR:
            allowed_locs = get_supervisor_location_ids(user)
            return qs.filter(location_id__in=allowed_locs)
        elif user.role == User.Role.CLIENT:
            allowed_locs = get_client_location_ids(user)
            return qs.filter(location_id__in=allowed_locs)
        return qs

    def update(self, request, *args, **kwargs):
        if request.user.role == User.Role.CLIENT:
            return Response({"success": False, "data": None, "error": {"code": "FORBIDDEN", "message": "Clients cannot update duty schedules."}}, status=status.HTTP_403_FORBIDDEN)

        instance = self.get_object()
        serializer = DutyScheduleCreateUpdateSerializer(instance, data=request.data, partial=True, context={"request_user": request.user})
        if not serializer.is_valid():
            return Response({"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "details": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent supervisor from transferring shift to an unassigned location
        if request.user.role == User.Role.SUPERVISOR and "location" in serializer.validated_data:
            allowed_locs = get_supervisor_location_ids(request.user)
            if serializer.validated_data["location"].id not in allowed_locs:
                return Response({"success": False, "data": None, "error": {"code": "FORBIDDEN", "message": "Cannot reassign shift to an unassigned site."}}, status=status.HTTP_403_FORBIDDEN)

        try:
            updated_instance = serializer.save()
            warning = getattr(serializer, "advisory_warning", None)
            data = DutyScheduleSerializer(updated_instance).data
            return Response({"success": True, "data": {"schedule": data, "warning": warning}, "error": None}, status=status.HTTP_200_OK)
        except ScheduleConflictError as e:
            conflict_data = None
            if e.conflicting_schedule:
                conflict_data = {
                    "id": e.conflicting_schedule.id,
                    "shift_start": e.conflicting_schedule.shift_start.isoformat(),
                    "shift_end": e.conflicting_schedule.shift_end.isoformat(),
                    "location_name": e.conflicting_schedule.location.name,
                    "post_name": e.conflicting_schedule.post.name,
                }
            return Response(
                {"success": False, "data": None, "error": {"code": "SCHEDULE_CONFLICT", "message": e.message, "conflicting_schedule": conflict_data}},
                status=status.HTTP_409_CONFLICT,
            )
        except ValidationError as e:
            return Response({"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)


class ScheduleCancelView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupervisor]

    def get_queryset(self):
        user = self.request.user
        qs = DutySchedule.objects.all()
        if user.role == User.Role.SUPERVISOR:
            allowed_locs = get_supervisor_location_ids(user)
            return qs.filter(location_id__in=allowed_locs)
        return qs

    def post(self, request, pk=None):
        instance = self.get_object()
        ScheduleService.cancel_schedule(instance)
        return Response({"success": True, "data": {"id": instance.id, "status": instance.status}, "error": None})


class MyDutyScheduleListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGuard]

    def list(self, request, *args, **kwargs):
        guard_profile = getattr(request.user, "guard_profile", None)
        if not guard_profile:
            return Response({"success": True, "data": [], "error": None})

        now = timezone.now()
        schedules = (
            DutySchedule.objects.filter(
                guard=guard_profile,
                status=DutySchedule.Status.SCHEDULED,
                shift_end__gte=now,
            )
            .select_related("client", "location", "post")
            .order_by("shift_start")
        )
        serializer = DutyScheduleSerializer(schedules, many=True)
        return Response({"success": True, "data": serializer.data, "error": None})
