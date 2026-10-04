"""Views for Site (Location) and Post CRUD management."""

from rest_framework import status, viewsets
from common.pagination import StandardResultsSetPagination
from common.permissions import (
    IsAdmin,
    IsSupervisor,
    IsClient,
    get_supervisor_location_ids,
    get_client_location_ids,
)
from common.responses import success_response
from apps.locations.models import Location, Post, SupervisorAssignment
from apps.locations.serializers import LocationSerializer, PostSerializer, SupervisorAssignmentSerializer


class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAdmin()]
        return [IsAdmin() | IsSupervisor() | IsClient()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Location.objects.none()

        if user.role == "ADMIN":
            queryset = Location.objects.select_related("client").prefetch_related("posts").all().order_by("-created_at")
        elif user.role == "SUPERVISOR":
            assigned_ids = get_supervisor_location_ids(user)
            queryset = Location.objects.filter(id__in=assigned_ids).order_by("-created_at")
        elif user.role == "CLIENT":
            client_ids = get_client_location_ids(user)
            queryset = Location.objects.filter(id__in=client_ids).order_by("-created_at")
        else:
            queryset = Location.objects.none()

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(address__icontains=search)
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
        loc = serializer.save()
        return success_response(LocationSerializer(loc).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        loc = serializer.save()
        return success_response(LocationSerializer(loc).data)


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAdmin()]
        return [IsAdmin() | IsSupervisor() | IsClient()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Post.objects.none()

        if user.role == "ADMIN":
            queryset = Post.objects.select_related("location").all().order_by("-created_at")
        elif user.role == "SUPERVISOR":
            assigned_ids = get_supervisor_location_ids(user)
            queryset = Post.objects.filter(location_id__in=assigned_ids).order_by("-created_at")
        elif user.role == "CLIENT":
            client_ids = get_client_location_ids(user)
            queryset = Post.objects.filter(location_id__in=client_ids).order_by("-created_at")
        else:
            queryset = Post.objects.none()

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
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
        post = serializer.save()
        return success_response(PostSerializer(post).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        return success_response(PostSerializer(post).data)
