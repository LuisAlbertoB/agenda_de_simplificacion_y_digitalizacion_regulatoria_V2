from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import DependenciaSerializer, DependenciaService


class DependenciaViewSet(ModelViewSet):
    """ViewSet para la gestión del catálogo de Dependencias."""
    serializer_class = DependenciaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DependenciaService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
