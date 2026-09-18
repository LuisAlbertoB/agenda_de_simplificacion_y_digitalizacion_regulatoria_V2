from rest_framework import serializers
from src.models import Usuario, Role, Dependencia
from src.services.role_serializer import RoleMinSerializer
from src.services.dependencia_serializer import DependenciaMinSerializer


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Usuario (AUTH_USER_MODEL)."""

    id_role = RoleMinSerializer(read_only=True)
    id_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='id_role',
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID del rol a asignar"
    )
    id_dependencia = DependenciaMinSerializer(read_only=True)
    id_dependencia_id = serializers.PrimaryKeyRelatedField(
        queryset=Dependencia.objects.all(),
        source='id_dependencia',
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID de la dependencia a la que pertenece el usuario"
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=6,
        style={'input_type': 'password'},
        help_text="Contraseña (se encriptará con Bcrypt)"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Usuario
        fields = [
            'id_usuario',
            'curp',
            'llave_mx',
            'correo_electronico',
            'nombres',
            'apellido1',
            'apellido2',
            'cargo_oficial',
            'is_oficial_link_person',
            'id_dependencia',
            'id_dependencia_id',
            'id_role',
            'id_role_id',
            'status',
            'password',
            'is_active',
            'is_staff',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_usuario', 'created_by_id', 'created_at', 'updated_at']

    def validate(self, attrs):
        password = attrs.get('password')
        if not self.instance and not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria al dar de alta un usuario."})

        correo = attrs.get('correo_electronico')
        if correo:
            qs = Usuario.objects.filter(correo_electronico__iexact=correo)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"correo_electronico": f"Ya existe un usuario registrado con el correo '{correo}'."})

        curp = attrs.get('curp')
        if curp:
            qs = Usuario.objects.filter(curp__iexact=curp)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"curp": f"Ya existe un usuario registrado con la CURP '{curp}'."})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario.objects.create(**validated_data)
        if password:
            user.set_password(password)  # Bcrypt
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)  # Bcrypt
        instance.save()
        return instance
