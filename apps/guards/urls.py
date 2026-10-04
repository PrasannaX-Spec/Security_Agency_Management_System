"""URL routes for Guard management."""

from rest_framework.routers import DefaultRouter
from apps.guards.views import GuardViewSet

router = DefaultRouter()
router.register(r"guards", GuardViewSet, basename="guard")

urlpatterns = router.urls
