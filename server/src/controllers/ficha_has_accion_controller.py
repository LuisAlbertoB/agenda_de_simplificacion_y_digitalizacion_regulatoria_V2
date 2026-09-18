from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import FichaHasAccionSerializer, FichaHasAccionService


class FichaHasAccionViewSet(ModelViewSet):
    """ViewSet para la relación Ficha-Acción."""
    serializer_class = FichaHasAccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FichaHasAccionService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
