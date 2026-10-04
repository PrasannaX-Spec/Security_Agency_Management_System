"""URL routes for Sites (Locations) and Posts management."""

from rest_framework.routers import DefaultRouter
from apps.locations.views import LocationViewSet, PostViewSet

router = DefaultRouter()
router.register(r"sites", LocationViewSet, basename="site")
router.register(r"posts", PostViewSet, basename="post")

urlpatterns = router.urls
