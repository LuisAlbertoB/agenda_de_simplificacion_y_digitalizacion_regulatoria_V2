from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import EntregableSerializer, EntregableService


class EntregableViewSet(ModelViewSet):
    """ViewSet para Entregables de Actividades."""
    serializer_class = EntregableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EntregableService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
