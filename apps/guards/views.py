"""Views for Guard CRUD management."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from common.pagination import StandardResultsSetPagination
from common.permissions import IsAdmin, IsSupervisor
from common.responses import success_response
from apps.guards.models import Guard
from apps.guards.serializers import GuardSerializer


class GuardViewSet(viewsets.ModelViewSet):
    serializer_class = GuardSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Guard.objects.select_related("user").all().order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(full_name__icontains=search) | queryset.filter(id_number__icontains=search)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guard = serializer.save()
        return success_response(GuardSerializer(guard).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        guard = serializer.save()
        return success_response(GuardSerializer(guard).data)

    @action(detail=True, methods=["patch"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        guard = self.get_object()
        guard.status = Guard.Status.INACTIVE
        guard.save()
        if guard.user:
            guard.user.status = "INACTIVE"
            guard.user.save()
        return success_response(GuardSerializer(guard).data)
