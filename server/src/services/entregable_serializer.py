from rest_framework import serializers
from src.models import Entregable, Actividad


class EntregableSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Entregable."""

    id_actividades_id = serializers.PrimaryKeyRelatedField(
        queryset=Actividad.objects.all(),
        source='id_actividades',
        write_only=True,
        help_text="ID de la actividad asociada"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Entregable
        fields = [
            'id_entregable',
            'id_actividades',
            'id_actividades_id',
            'clave',
            'titulo',
            'descripcion',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_entregable', 'id_actividades', 'created_by_id', 'created_at', 'updated_at']
