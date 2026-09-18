from src.models import Role


class RoleService:
    """Capa de servicio para la entidad Role."""

    @staticmethod
    def obtener_todos():
        return Role.objects.all()

    @staticmethod
    def obtener_por_id(id_role):
        try:
            return Role.objects.get(pk=id_role)
        except Role.DoesNotExist:
            return None
