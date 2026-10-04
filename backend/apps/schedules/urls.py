from django.urls import path
from apps.schedules.views import (
    ScheduleListCreateView,
    ScheduleDetailView,
    ScheduleCancelView,
    MyDutyScheduleListView,
)

urlpatterns = [
    path("schedules/", ScheduleListCreateView.as_view(), name="schedule-list-create"),
    path("schedules/<int:pk>/", ScheduleDetailView.as_view(), name="schedule-detail"),
    path("schedules/<int:pk>/cancel/", ScheduleCancelView.as_view(), name="schedule-cancel"),
    path("schedules/my/", MyDutyScheduleListView.as_view(), name="my-schedules"),
]
