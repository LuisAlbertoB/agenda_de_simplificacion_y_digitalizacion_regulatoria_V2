from src.models import Entregable


class EntregableService:
    """Capa de servicio para la entidad Entregable."""

    @staticmethod
    def obtener_todos():
        return Entregable.objects.select_related('id_actividad').all()

    @staticmethod
    def obtener_por_id(id_entregable):
        try:
            return Entregable.objects.select_related('id_actividad').get(pk=id_entregable)
        except Entregable.DoesNotExist:
            return None
