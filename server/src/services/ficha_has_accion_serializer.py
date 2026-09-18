from rest_framework import serializers
from src.models import FichaHasAccion, Ficha, Accion
from src.services.accion_serializer import AccionSerializer


class FichaHasAccionSerializer(serializers.ModelSerializer):
    """Serializer para la relación N:M Ficha - Accion."""

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
        model = FichaHasAccion
        fields = [
            'id_fichas_has_accion',
            'id_ficha',
            'id_ficha_id',
            'id_accion',
            'id_accion_id',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_fichas_has_accion', 'id_ficha', 'created_by_id', 'created_at', 'updated_at']
