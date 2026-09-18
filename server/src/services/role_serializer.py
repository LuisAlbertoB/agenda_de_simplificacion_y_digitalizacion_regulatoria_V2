from rest_framework import serializers
from src.models import Role


class RoleMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id_role', 'clave', 'nombre_oficial']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer para el catálogo de roles del sistema."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Role
        fields = [
            'id_role',
            'clave',
            'nombre_oficial',
            'siglas',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_role', 'created_by_id', 'created_at', 'updated_at']

    def validate_clave(self, value):
        if value:
            qs = Role.objects.filter(clave__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(f"Ya existe un rol registrado con la clave '{value}'.")
        return value
