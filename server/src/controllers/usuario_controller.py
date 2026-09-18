from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import UsuarioSerializer, UsuarioService


class UsuarioViewSet(ModelViewSet):
    """ViewSet para la gestión de Usuarios."""
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UsuarioService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
