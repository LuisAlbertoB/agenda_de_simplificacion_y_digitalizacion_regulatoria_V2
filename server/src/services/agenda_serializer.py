from rest_framework import serializers
from src.models import Agenda, Dependencia, Usuario
from src.services.dependencia_serializer import DependenciaMinSerializer


class UsuarioMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'correo_electronico', 'nombres', 'apellido1']


class AgendaSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Agenda."""

    id_dependencia = DependenciaMinSerializer(read_only=True)
    id_dependencia_id = serializers.PrimaryKeyRelatedField(
        queryset=Dependencia.objects.all(),
        source='id_dependencia',
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID de la dependencia emisora"
    )
    enlace_oficial = UsuarioMinSerializer(read_only=True)
    enlace_oficial_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        source='enlace_oficial',
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID del usuario enlace oficial"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')

    class Meta:
        model = Agenda
        fields = [
            'id_agenda',
            'id_dependencia',
            'id_dependencia_id',
            'anio',
            'semestre',
            'unidad_administrativa',
            'titular_unidad_admin',
            'enlace_oficial',
            'enlace_oficial_id',
            'elaboro_nombre',
            'elaboro_puesto',
            'reviso1_nombre',
            'reviso1_puesto',
            'reviso2_nombre',
            'reviso2_puesto',
            'autorizo_nombre',
            'autorizo_puesto',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_agenda', 'created_by_id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        firmantes_fields = [
            'elaboro_nombre', 'elaboro_puesto',
            'reviso1_nombre', 'reviso1_puesto',
            'reviso2_nombre', 'reviso2_puesto',
            'autorizo_nombre', 'autorizo_puesto'
        ]
        if isinstance(data, dict):
            data = data.copy()
            for field in firmantes_fields:
                if field in data:
                    val = data[field]
                    if isinstance(val, str):
                        val_stripped = val.strip()
                        data[field] = val_stripped if val_stripped != '' else None
        return super().to_internal_value(data)

    def validate(self, attrs):
        id_dependencia = attrs.get('id_dependencia', getattr(self.instance, 'id_dependencia', None))
        anio = attrs.get('anio', getattr(self.instance, 'anio', None))
        semestre = attrs.get('semestre', getattr(self.instance, 'semestre', None))

        if id_dependencia and anio is not None and semestre is not None:
            qs = Agenda.objects.filter(id_dependencia=id_dependencia, anio=anio, semestre=semestre)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                sem_str = "1" if (semestre is True or semestre == 1 or semestre == "1") else "2"
                raise serializers.ValidationError(
                    f"Ya existe una agenda registrada para esta dependencia en el periodo {anio}-{sem_str}."
                )
        return attrs
