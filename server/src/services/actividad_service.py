from src.models import Actividad


class ActividadService:
    """Capa de servicio para la entidad Actividad."""

    @staticmethod
    def obtener_todos():
        return Actividad.objects.select_related('id_accion').all()

    @staticmethod
    def obtener_por_id(id_actividades):
        try:
            return Actividad.objects.select_related('id_accion').get(pk=id_actividades)
        except Actividad.DoesNotExist:
            return None
