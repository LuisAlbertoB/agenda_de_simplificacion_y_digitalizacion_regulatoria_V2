from rest_framework import serializers
from src.models import TramiteOServicio, TramiteTipoAtencion
from src.services.tramite_tipo_atencion_serializer import TramiteTipoAtencionSerializer


class TramiteOServicioSerializer(serializers.ModelSerializer):
    """Serializer para la entidad TramiteOServicio."""

    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')
    tipos_atencion = TramiteTipoAtencionSerializer(many=True, read_only=True)
    tipos_atencion_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista de modalidades de atención: 0=Presencial, 1=Vía Telefónica, 2=Vía Digital"
    )

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
            'tipos_atencion',
            'tipos_atencion_ids',
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

    def create(self, validated_data):
        tipos_ids = validated_data.pop('tipos_atencion_ids', None)
        tramite = super().create(validated_data)
        if tipos_ids is not None:
            self._sync_tipos_atencion(tramite, tipos_ids)
        return tramite

    def update(self, instance, validated_data):
        tipos_ids = validated_data.pop('tipos_atencion_ids', None)
        tramite = super().update(instance, validated_data)
        if tipos_ids is not None:
            self._sync_tipos_atencion(tramite, tipos_ids)
        return tramite

    def _sync_tipos_atencion(self, tramite, tipos_ids):
        tramite.tipos_atencion.all().delete()
        for t_val in tipos_ids:
            try:
                TramiteTipoAtencion.objects.create(
                    id_tramite_servicio=tramite,
                    tipo=int(t_val)
                )
            except (ValueError, TypeError):
                pass
