from rest_framework import serializers
from src.models import Dependencia


class DependenciaMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependencia
        fields = ['id_dependencia', 'clave', 'nombre_oficial']


class DependenciaSerializer(serializers.ModelSerializer):
    """Serializer para el catálogo de dependencias gubernamentales."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Dependencia
        fields = [
            'id_dependencia',
            'clave',
            'nombre_oficial',
            'siglas',
            'titular_dependencia',
            'ambito',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_dependencia', 'created_by_id', 'created_at', 'updated_at']

    def validate_clave(self, value):
        if value:
            qs = Dependencia.objects.filter(clave__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(f"Ya existe una dependencia registrada con la clave '{value}'.")
        return value
