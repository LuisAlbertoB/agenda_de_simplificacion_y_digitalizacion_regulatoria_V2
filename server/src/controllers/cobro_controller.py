from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import CobroSerializer, CobroService


class CobroViewSet(ModelViewSet):
    """ViewSet para los conceptos de Cobro de una Ficha."""
    serializer_class = CobroSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CobroService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
