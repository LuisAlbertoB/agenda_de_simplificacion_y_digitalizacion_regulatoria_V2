from src.models import TramiteOServicio


class TramiteOServicioService:
    """Capa de servicio para la entidad TramiteOServicio."""

    @staticmethod
    def obtener_todos():
        return TramiteOServicio.objects.prefetch_related('tipos_atencion').all()

    @staticmethod
    def obtener_por_id(id_tramite_servicio):
        try:
            return TramiteOServicio.objects.get(pk=id_tramite_servicio)
        except TramiteOServicio.DoesNotExist:
            return None
