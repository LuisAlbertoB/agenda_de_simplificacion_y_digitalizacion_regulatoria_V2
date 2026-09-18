from src.models import Accion


class AccionService:
    """Capa de servicio para la entidad Accion."""

    @staticmethod
    def obtener_todos():
        return Accion.objects.all()

    @staticmethod
    def obtener_por_id(id_accion):
        try:
            return Accion.objects.get(pk=id_accion)
        except Accion.DoesNotExist:
            return None
