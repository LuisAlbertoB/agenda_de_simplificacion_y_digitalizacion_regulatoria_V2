from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import EntregableSerializer, EntregableService


class EntregableViewSet(ModelViewSet):
    """ViewSet para Entregables de Actividades."""
    serializer_class = EntregableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EntregableService.obtener_todos()
        id_actividad = self.request.query_params.get('id_actividad')
        if id_actividad:
            qs = qs.filter(id_actividad_id=id_actividad)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
