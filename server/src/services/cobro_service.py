from src.models import Cobro


class CobroService:
    """Capa de servicio para la entidad Cobro."""

    @staticmethod
    def obtener_todos():
        return Cobro.objects.select_related('id_ficha').all()

    @staticmethod
    def obtener_por_id(id_cobros):
        try:
            return Cobro.objects.select_related('id_ficha').get(pk=id_cobros)
        except Cobro.DoesNotExist:
            return None
