from rest_framework import serializers
from src.models import TramiteOServicio


class TramiteOServicioSerializer(serializers.ModelSerializer):
    """Serializer para la entidad TramiteOServicio."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = TramiteOServicio
        fields = [
            'id_tramite_servicio',
            'clave',
            'nombre_oficial',
            'descripcion',
            'objetivo',
            'tipo',
            'tramite_o_servicio',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_tramite_servicio', 'created_by_id', 'created_at', 'updated_at']

    def validate_clave(self, value):
        if value:
            qs = TramiteOServicio.objects.filter(clave__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(f"Ya existe un trámite o servicio registrado con la clave '{value}'.")
        return value
