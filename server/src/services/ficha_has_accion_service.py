from src.models import FichaHasAccion


class FichaHasAccionService:
    """Capa de servicio para la relación FichaHasAccion."""

    @staticmethod
    def obtener_todos():
        return FichaHasAccion.objects.select_related('id_ficha', 'id_accion').all()

    @staticmethod
    def obtener_por_id(id_fichas_has_accion):
        try:
            return FichaHasAccion.objects.select_related('id_ficha', 'id_accion').get(pk=id_fichas_has_accion)
        except FichaHasAccion.DoesNotExist:
            return None
