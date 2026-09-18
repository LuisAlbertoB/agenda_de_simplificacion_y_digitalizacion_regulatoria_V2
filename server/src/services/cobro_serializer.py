from rest_framework import serializers
from src.models import Cobro, Ficha


class CobroSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Cobro."""

    id_ficha_id = serializers.PrimaryKeyRelatedField(
        queryset=Ficha.objects.all(),
        source='id_ficha',
        write_only=True,
        help_text="ID de la ficha asociada"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Cobro
        fields = [
            'id_cobros',
            'id_ficha',
            'id_ficha_id',
            'concepto',
            'unidad_medida',
            'importe',
            'forma_pago',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_cobros', 'id_ficha', 'created_by_id', 'created_at', 'updated_at']
