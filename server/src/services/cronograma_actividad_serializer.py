from rest_framework import serializers
from src.models import CronogramaActividad, Ficha, Accion
from src.services.accion_serializer import AccionSerializer


class CronogramaActividadSerializer(serializers.ModelSerializer):
    """Serializer para la entidad CronogramaActividad."""

    id_ficha_id = serializers.PrimaryKeyRelatedField(
        queryset=Ficha.objects.all(),
        source='id_ficha',
        write_only=True,
        help_text="ID de la ficha"
    )
    id_accion = AccionSerializer(read_only=True)
    id_accion_id = serializers.PrimaryKeyRelatedField(
        queryset=Accion.objects.all(),
        source='id_accion',
        write_only=True,
        help_text="ID de la acción"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = CronogramaActividad
        fields = [
            'id_cronograma',
            'id_ficha',
            'id_ficha_id',
            'id_accion',
            'id_accion_id',
            'num_mes_inicio_plazo',
            'num_mes_final_plazo',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_cronograma', 'id_ficha', 'created_by_id', 'created_at', 'updated_at']

    def validate(self, attrs):
        inicio = attrs.get('num_mes_inicio_plazo')
        final = attrs.get('num_mes_final_plazo')
        if inicio is not None and final is not None and inicio > final:
            raise serializers.ValidationError({
                "num_mes_final_plazo": "El mes final del plazo debe ser mayor o igual al mes de inicio."
            })
        return attrs
