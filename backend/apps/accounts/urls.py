"""URL patterns for authentication."""

from django.urls import path

from .views import (
    LoginView,
    CustomTokenRefreshView,
    MeView,
    AcceptTermsView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("login", LoginView.as_view(), name="auth-login-noslash"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="auth-refresh"),
    path("refresh", CustomTokenRefreshView.as_view(), name="auth-refresh-noslash"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("me", MeView.as_view(), name="auth-me-noslash"),
    path("accept-terms/", AcceptTermsView.as_view(), name="auth-accept-terms"),
    path("accept-terms", AcceptTermsView.as_view(), name="auth-accept-terms-noslash"),
]
