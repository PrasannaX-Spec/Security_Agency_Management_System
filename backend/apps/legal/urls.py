"""URL patterns for legal pages (public)."""

from django.urls import path

from .views import TermsView, PrivacyView

urlpatterns = [
    path("terms/", TermsView.as_view(), name="legal-terms"),
    path("terms", TermsView.as_view(), name="legal-terms-noslash"),
    path("privacy/", PrivacyView.as_view(), name="legal-privacy"),
    path("privacy", PrivacyView.as_view(), name="legal-privacy-noslash"),
]
