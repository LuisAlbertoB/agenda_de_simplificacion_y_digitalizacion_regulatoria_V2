from rest_framework import serializers
from src.models import Actividad, Accion
from src.services.accion_serializer import AccionSerializer


class ActividadSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Actividad (id_actividades PK)."""

    id_accion = AccionSerializer(read_only=True)
    id_accion_id = serializers.PrimaryKeyRelatedField(
        queryset=Accion.objects.all(),
        source='id_accion',
        write_only=True,
        help_text="ID de la acción asociada"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Actividad
        fields = [
            'id_actividades',
            'id_accion',
            'id_accion_id',
            'clave',
            'titulo',
            'descripcion',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_actividades', 'created_by_id', 'created_at', 'updated_at']
