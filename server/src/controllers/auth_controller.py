from rest_framework_simplejwt.views import TokenObtainPairView
from src.services.auth_serializer import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Endpoint de autenticación JWT (login) que incluye datos extendidos del usuario."""
    serializer_class = CustomTokenObtainPairSerializer
