from src.models import Usuario


class UsuarioService:
    """Capa de servicio para la entidad Usuario."""

    @staticmethod
    def obtener_todos():
        return Usuario.objects.select_related('id_role', 'id_dependencia').all()

    @staticmethod
    def obtener_por_id(id_usuario):
        try:
            return Usuario.objects.select_related('id_role', 'id_dependencia').get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return None

    @staticmethod
    def obtener_por_correo(correo_electronico):
        try:
            return Usuario.objects.select_related('id_role', 'id_dependencia').get(correo_electronico=correo_electronico)
        except Usuario.DoesNotExist:
            return None
