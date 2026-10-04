"""Views for Client CRUD management."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from common.pagination import StandardResultsSetPagination
from common.permissions import IsAdmin, IsClient
from common.responses import success_response
from apps.clients.models import Client
from apps.clients.serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ["list", "create", "status"]:
            return [IsAdmin()]
        return [IsAdmin() | IsClient()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Client.objects.none()

        if user.role == "ADMIN":
            queryset = Client.objects.all().order_by("-created_at")
        elif user.role == "CLIENT" and hasattr(user, "client_profile"):
            queryset = Client.objects.filter(pk=user.client_profile.pk)
        else:
            queryset = Client.objects.none()

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(company_name__icontains=search) | queryset.filter(contact_person__icontains=search)
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
        client = serializer.save()
        return success_response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return success_response(ClientSerializer(client).data)

    @action(detail=True, methods=["patch"], url_path="status")
    def status(self, request, pk=None):
        client = self.get_object()
        new_status = request.data.get("status")
        if new_status in [Client.Status.ACTIVE, Client.Status.INACTIVE]:
            client.status = new_status
            client.save()
            if client.user:
                client.user.status = new_status
                client.user.save()
            return success_response(ClientSerializer(client).data)
        return success_response(ClientSerializer(client).data, status=status.HTTP_400_BAD_REQUEST)
