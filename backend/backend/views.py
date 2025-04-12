from django.contrib.auth.models import Group, User
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
import numpy as np
from openai import AsyncOpenAI
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


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


openai_client = AsyncOpenAI()


class AppearanceSearchView(APIView):
    def post(self, request):
        description = request.data.get("appearance", "").strip()
        if not description:
            return Response(
                {"error": "Empty description"}, status=status.HTTP_400_BAD_REQUEST
            )

        return self._search(description)

    def _search(self, description):
        try:
            embedding_response = async_to_sync(openai_client.embeddings.create)(
                input=[description], model="text-embedding-3-small"
            )
            query_embedding = np.array(embedding_response.data[0].embedding)

            results = []
            captives = Captive.objects.exclude(appearance_embedded__isnull=True)

            for captive in captives:
                try:
                    vector_string = captive.appearance_embedded.strip("{}")
                    if not vector_string:
                        continue

                    captive_embedding = np.fromstring(vector_string, sep=",")

                    if captive_embedding.shape != query_embedding.shape:
                        logger.warning(
                            f"Vector shape mismatch for captive {captive.id}: {captive_embedding.shape} vs {query_embedding.shape}"
                        )
                        continue

                    norm_query = np.linalg.norm(query_embedding)
                    norm_captive = np.linalg.norm(captive_embedding)

                    if norm_query == 0 or norm_captive == 0:
                        similarity = 0
                    else:
                        similarity = np.dot(query_embedding, captive_embedding) / (
                            norm_query * norm_captive
                        )

                    results.append((similarity, captive))
                except Exception as inner_e:
                    logger.warning(
                        f"Error processing captive {captive.id}: {str(inner_e)}"
                    )
                    continue

            results.sort(key=lambda x: x[0], reverse=True)
            top_matches = results[:5]

            for sim, c in top_matches:
                c._similarity = sim

            sorted_captives = [c for _, c in top_matches]
            serializer = CaptiveSerializer(
                sorted_captives, many=True, context={"request": self.request}
            )
            return Response(serializer.data)
        except Exception as e:
            import logging

            logging.error(f"Error in appearance search: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
