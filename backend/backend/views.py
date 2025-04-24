from django.contrib.auth.models import Group, User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from rest_framework import permissions, viewsets, status
from .models import Captive
from .serializers import CaptiveSerializer, UserSerializer
from tutorial.quickstart.serializers import GroupSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout
from rest_framework import serializers
from .serializers import LoginSerializer
from django.http import JsonResponse
import django_filters
from django.db.models import Q
from .ai_tools import (
    search_appearence,
    search_photo,
    create_embedding,
    create_photo_embedding,
)
import json
import asyncio
from asgiref.sync import sync_to_async


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(id=self.request.user.id)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class CaptiveFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(method="filter_status")

    class Meta:
        model = Captive
        fields = ["status"]

    def filter_status(self, queryset, name, value):
        statuses = value.split("|")
        q_objects = Q()
        for status in statuses:
            q_objects |= Q(status__iexact=status.strip())
        return queryset.filter(q_objects)


class CaptiveViewSet(viewsets.ModelViewSet):
    queryset = Captive.objects.all()
    serializer_class = CaptiveSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = CaptiveFilter

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)

        if instance.appearance:
            embedding = asyncio.run(create_embedding(instance.appearance))
            instance.appearance_embedded = json.dumps(embedding)
            instance.save(update_fields=["appearance_embedded"])

        if instance.picture:
            image_bytes = instance.picture.read()
            instance.picture.seek(0)
            embedding = asyncio.run(create_photo_embedding(image_bytes))
            instance.picture_embedded = json.dumps(embedding)
            instance.save(update_fields=["picture_embedded"])


class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data["user"]
            login(request, user)
        except serializers.ValidationError as e:
            if "non_field_errors" in e.detail:
                return JsonResponse(
                    {"detail": "\n".join(e.detail["non_field_errors"])},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return JsonResponse(
                    {"detail": str(e.detail)}, status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return JsonResponse({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(
            {"detail": "Logged in successfully."}, status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(
            {"message": "User logged out successfully"}, status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    def post(self, request):
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        email = request.data.get("email")
        username = request.data.get("username")
        password = request.data.get("password")

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        login(request, user)
        return Response(
            {"message": "User registered and logged in successfully"},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return JsonResponse(
            UserSerializer(request.user, context={"request": request}).data
        )


@login_required
@require_POST
async def appearance_search(request):
    data = json.loads(request.body)
    description = data.get("appearance", "").strip()
    status_filter = data.get("status", "")
    if not description:
        return JsonResponse(
            {"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        embedding = await create_embedding(description)
        search_results = await search_appearence(embedding, request, status_filter)
        return JsonResponse(search_results, safe=False)
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@login_required
@require_POST
async def photo_search(request):
    photo_file = request.FILES.get("photo")
    status_filter = request.POST.get("status", "")

    if not photo_file:
        return JsonResponse(
            {"error": "Photo is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        image_bytes = await sync_to_async(photo_file.read)()
        embedding = await create_photo_embedding(image_bytes)
        if embedding is None:
            return JsonResponse(
                {"error": "Failed to create embedding from the provided image"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        search_results = await search_photo(embedding, request, status_filter)
        return JsonResponse(search_results, safe=False)

    except Exception as e:
        return JsonResponse(
            {"error": f"Error processing image: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
