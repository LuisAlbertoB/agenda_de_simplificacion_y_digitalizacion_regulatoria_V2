from rest_framework import serializers
from src.models import RoleHasPermiso, Role, Permiso


class RoleSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id_role', 'clave', 'nombre_oficial']


class PermisoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id_permiso', 'clave', 'valor']


class RoleHasPermisoSerializer(serializers.ModelSerializer):
    """Serializer para la tabla pivote roles_has_permisos."""

    id_role = RoleSimpleSerializer(read_only=True)
    id_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='id_role',
        write_only=True,
        help_text="ID del rol"
    )
    id_permiso = PermisoSimpleSerializer(read_only=True)
    id_permiso_id = serializers.PrimaryKeyRelatedField(
        queryset=Permiso.objects.all(),
        source='id_permiso',
        write_only=True,
        help_text="ID del permiso"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = RoleHasPermiso
        fields = [
            'id_role_has_permiso',
            'id_role',
            'id_role_id',
            'id_permiso',
            'id_permiso_id',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_role_has_permiso', 'created_by_id', 'created_at', 'updated_at']
