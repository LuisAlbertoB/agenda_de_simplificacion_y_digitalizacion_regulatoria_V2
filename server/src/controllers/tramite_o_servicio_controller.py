from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import TramiteOServicioSerializer, TramiteOServicioService


class TramiteOServicioViewSet(ModelViewSet):
    """ViewSet para el catálogo de Trámites o Servicios."""
    serializer_class = TramiteOServicioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TramiteOServicioService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
