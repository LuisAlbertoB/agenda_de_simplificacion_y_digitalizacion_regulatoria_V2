from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import CronogramaActividadSerializer, CronogramaActividadService


class CronogramaActividadViewSet(ModelViewSet):
    """ViewSet para el Cronograma de Actividades por Ficha."""
    serializer_class = CronogramaActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CronogramaActividadService.obtener_todos()
        id_ficha = self.request.query_params.get('id_ficha')
        if id_ficha:
            qs = qs.filter(id_ficha_id=id_ficha)
        id_actividad = self.request.query_params.get('id_actividad')
        if id_actividad:
            qs = qs.filter(id_actividad_id=id_actividad)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
