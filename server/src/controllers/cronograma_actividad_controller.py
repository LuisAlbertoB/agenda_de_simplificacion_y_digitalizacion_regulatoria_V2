from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import CronogramaActividadSerializer, CronogramaActividadService


class CronogramaActividadViewSet(ModelViewSet):
    """ViewSet para el Cronograma de Actividades por Ficha."""
    serializer_class = CronogramaActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CronogramaActividadService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
