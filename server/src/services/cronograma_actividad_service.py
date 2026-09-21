from src.models import CronogramaActividad


class CronogramaActividadService:
    """Capa de servicio para la entidad CronogramaActividad."""

    @staticmethod
    def obtener_todos():
        return CronogramaActividad.objects.select_related('id_ficha', 'id_actividad', 'id_actividad__id_accion').all()

    @staticmethod
    def obtener_por_id(id_cronograma):
        try:
            return CronogramaActividad.objects.select_related('id_ficha', 'id_actividad', 'id_actividad__id_accion').get(pk=id_cronograma)
        except CronogramaActividad.DoesNotExist:
            return None

    @staticmethod
    def validar_rango_meses(inicio, final):
        """
        Validación de negocio: Verificar que num_mes_inicio_plazo <= num_mes_final_plazo.
        TODO(negocio): Reglas adicionales de traslape en Sprint 2.
        """
        if inicio > final:
            raise ValueError("El mes de inicio no puede ser posterior al mes final del plazo.")
