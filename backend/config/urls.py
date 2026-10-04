"""Root URL configuration."""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API schema and docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # App endpoints
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.clients.urls")),
    path("api/", include("apps.guards.urls")),
    path("api/", include("apps.locations.urls")),
    path("api/", include("apps.schedules.urls")),
    path("api/legal/", include("apps.legal.urls")),
]

