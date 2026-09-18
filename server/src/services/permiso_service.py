from src.models import Permiso


class PermisoService:
    """Capa de servicio para la entidad Permiso."""

    @staticmethod
    def obtener_todos():
        return Permiso.objects.all()

    @staticmethod
    def obtener_por_id(id_permiso):
        try:
            return Permiso.objects.get(pk=id_permiso)
        except Permiso.DoesNotExist:
            return None
