from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import ActividadSerializer, ActividadService


class ActividadViewSet(ModelViewSet):
    """ViewSet para el catálogo de Actividades."""
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ActividadService.obtener_todos()
        id_accion = self.request.query_params.get('id_accion')
        if id_accion:
            qs = qs.filter(id_accion_id=id_accion)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
