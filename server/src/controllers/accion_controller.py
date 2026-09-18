from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import AccionSerializer, AccionService


class AccionViewSet(ModelViewSet):
    """ViewSet para el catálogo de Acciones."""
    serializer_class = AccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AccionService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
