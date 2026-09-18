from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import PermisoSerializer, PermisoService


class PermisoViewSet(ModelViewSet):
    """ViewSet para la gestión del catálogo de Permisos."""
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PermisoService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
