from rest_framework import serializers
from src.models import Permiso


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer para el catálogo de permisos del sistema."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Permiso
        fields = [
            'id_permiso',
            'clave',
            'valor',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_permiso', 'created_by_id', 'created_at', 'updated_at']
