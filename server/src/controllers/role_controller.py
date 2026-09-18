from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import RoleSerializer, RoleService


class RoleViewSet(ModelViewSet):
    """ViewSet para la gestión del catálogo de Roles."""
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RoleService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
