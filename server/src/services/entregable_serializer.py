from rest_framework import serializers
from src.models import Entregable, Actividad
from src.services.actividad_serializer import ActividadSerializer


class EntregableSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Entregable."""

    id_actividad = ActividadSerializer(read_only=True)
    id_actividad_id = serializers.PrimaryKeyRelatedField(
        queryset=Actividad.objects.all(),
        source='id_actividad',
        write_only=True,
        help_text="ID de la actividad asociada"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Entregable
        fields = [
            'id_entregable',
            'id_actividad',
            'id_actividad_id',
            'clave',
            'titulo',
            'descripcion',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_entregable', 'created_by_id', 'created_at', 'updated_at']
