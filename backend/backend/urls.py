from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"groups", views.GroupViewSet)
router.register(r"captives", views.CaptiveViewSet, basename="captive")


urlpatterns = [
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("me/", views.MeView.as_view(), name="me"),
    path("admin/", admin.site.urls),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path(
        "appearance_search/",
        views.appearance_search,
        name="appearance_search",
    ),
    path(
        "photo_search/",
        views.photo_search,
        name="photo_search",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
