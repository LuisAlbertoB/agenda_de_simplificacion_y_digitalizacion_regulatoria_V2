from src.models import Dependencia


class DependenciaService:
    """Capa de servicio para la entidad Dependencia."""

    @staticmethod
    def obtener_todos():
        return Dependencia.objects.all()

    @staticmethod
    def obtener_por_id(id_dependencia):
        try:
            return Dependencia.objects.get(pk=id_dependencia)
        except Dependencia.DoesNotExist:
            return None
