from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import ActividadSerializer, ActividadService


class ActividadViewSet(ModelViewSet):
    """ViewSet para el catálogo de Actividades."""
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActividadService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
