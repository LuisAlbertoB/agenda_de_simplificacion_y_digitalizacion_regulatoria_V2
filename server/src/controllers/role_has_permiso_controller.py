from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from src.services import RoleHasPermisoSerializer, RoleHasPermisoService


class RoleHasPermisoViewSet(ModelViewSet):
    """ViewSet para la asignación de Permisos a Roles."""
    serializer_class = RoleHasPermisoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RoleHasPermisoService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
