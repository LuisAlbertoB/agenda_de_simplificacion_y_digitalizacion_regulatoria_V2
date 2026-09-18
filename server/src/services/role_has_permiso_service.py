from src.models import RoleHasPermiso


class RoleHasPermisoService:
    """Capa de servicio para la relación RoleHasPermiso."""

    @staticmethod
    def obtener_todos():
        return RoleHasPermiso.objects.select_related('id_role', 'id_permiso').all()

    @staticmethod
    def obtener_por_id(id_role_has_permiso):
        try:
            return RoleHasPermiso.objects.select_related('id_role', 'id_permiso').get(pk=id_role_has_permiso)
        except RoleHasPermiso.DoesNotExist:
            return None
