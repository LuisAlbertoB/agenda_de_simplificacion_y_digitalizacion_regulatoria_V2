from rest_framework import serializers
from src.models import CronogramaActividad, Ficha, Actividad
from src.services.actividad_serializer import ActividadSerializer
from src.services.accion_serializer import AccionSerializer


class CronogramaActividadSerializer(serializers.ModelSerializer):
    """Serializer para la entidad CronogramaActividad."""

    id_ficha_id = serializers.PrimaryKeyRelatedField(
        queryset=Ficha.objects.all(),
        source='id_ficha',
        write_only=True,
        help_text="ID de la ficha"
    )
    id_actividad = ActividadSerializer(read_only=True)
    id_actividad_id = serializers.PrimaryKeyRelatedField(
        queryset=Actividad.objects.all(),
        source='id_actividad',
        write_only=True,
        help_text="ID de la actividad"
    )
    id_accion = AccionSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = CronogramaActividad
        fields = [
            'id_cronograma',
            'id_ficha',
            'id_ficha_id',
            'id_actividad',
            'id_actividad_id',
            'id_accion',
            'num_mes_inicio_plazo',
            'num_mes_final_plazo',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_cronograma', 'id_ficha', 'id_accion', 'created_by_id', 'created_at', 'updated_at']

    def validate(self, attrs):
        inicio = attrs.get('num_mes_inicio_plazo', getattr(self.instance, 'num_mes_inicio_plazo', None))
        final = attrs.get('num_mes_final_plazo', getattr(self.instance, 'num_mes_final_plazo', None))
        if inicio is not None and final is not None and inicio > final:
            raise serializers.ValidationError({
                "num_mes_final_plazo": "El mes final del plazo debe ser mayor o igual al mes de inicio."
            })
        return attrs
