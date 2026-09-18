from rest_framework import serializers
from src.models import Accion


class AccionSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Accion."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Accion
        fields = [
            'id_accion',
            'simplificacion_o_digitalizacion',
            'clave',
            'titulo',
            'descripcion',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_accion', 'created_by_id', 'created_at', 'updated_at']

    def validate_clave(self, value):
        if value:
            qs = Accion.objects.filter(clave__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(f"Ya existe una acción registrada con la clave '{value}'.")
        return value
