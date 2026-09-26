from rest_framework import serializers
from src.models import Ficha, Agenda, TramiteOServicio, FichaNivelDigitalizacion
from src.services.tramite_o_servicio_serializer import TramiteOServicioSerializer
from src.services.ficha_nivel_digitalizacion_serializer import FichaNivelDigitalizacionSerializer


class AgendaMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        fields = ['id_agenda', 'anio', 'semestre', 'unidad_administrativa', 'status']


class FichaSerializer(serializers.ModelSerializer):
    """Serializer para la entidad Ficha (diagnóstico y digitalización)."""

    id_agenda = AgendaMinSerializer(read_only=True)
    id_agenda_id = serializers.PrimaryKeyRelatedField(
        queryset=Agenda.objects.all(),
        source='id_agenda',
        write_only=True,
        help_text="ID de la agenda a la que pertenece la ficha"
    )
    id_tramite_servicio = TramiteOServicioSerializer(read_only=True)
    id_tramite_servicio_id = serializers.PrimaryKeyRelatedField(
        queryset=TramiteOServicio.objects.all(),
        source='id_tramite_servicio',
        write_only=True,
        help_text="ID del trámite/servicio diagnosticado"
    )
    created_by_id = serializers.PrimaryKeyRelatedField(read_only=True, source='created_by')
    valor_priorizacion = serializers.SerializerMethodField(read_only=True)
    niveles_digitalizacion = FichaNivelDigitalizacionSerializer(many=True, read_only=True)
    niveles_digitalizacion_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista de niveles de madurez digital (0-4)"
    )

    class Meta:
        model = Ficha
        fields = [
            'id_ficha',
            'id_agenda',
            'id_agenda_id',
            'id_tramite_servicio',
            'id_tramite_servicio_id',
            'solicitud_tipo',
            'plazo_maximo_resolucion_dias',
            'is_dia_habil_o_inhabil',
            'vigencia_del_documento_obtenido',
            'conceptos_con_fundamento',
            'numero_requisitos',
            'poblacion_prioritaria_atencion_preferente',
            'solicitudes_recibidas_semestre_anterior',
            'resoluciones_positivas',
            'cantidad_personas_intervienen',
            'areas_administrativas_interfieren',
            'condiciones_o_criterios_de_resolucion',
            'habile_ventanilla_presencial',
            'habile_portal_web_municipal',
            'habile_app_mobile',
            'habile_linea_telefonica',
            'cuellos_de_botella',
            'requisitos_sin_valor',
            'propuestas_de_mejora',
            'analisis_requisitos_json',
            'regulacion_fundamenta_existencia_tramite',
            'regulacion_faculta_organo',
            'fundamento_en_ley_de_ingresos',
            'unidad_de_cobro',
            'importe_tramite',
            'tipo_tramite_dirigido',
            'formas_de_pago',
            'nivel_digitalizacion_actual',
            'niveles_digitalizacion',
            'niveles_digitalizacion_ids',
            'propuesta_mejora_transaccion_tecnologica',
            'status',
            'valor_priorizacion',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_ficha', 'valor_priorizacion',
            'created_by_id', 'created_at', 'updated_at']

    def get_valor_priorizacion(self, obj):
        from src.services.ficha_service import FichaService
        res = FichaService.calcular_puntaje_priorizacion(obj)
        return res.get('puntaje_total', 0)

    def validate_importe_tramite(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El importe del trámite no puede ser un valor negativo.")
        return value

    def validate(self, attrs):
        id_agenda = attrs.get('id_agenda', getattr(self.instance, 'id_agenda', None))
        id_tramite = attrs.get('id_tramite_servicio', getattr(self.instance, 'id_tramite_servicio', None))

        if id_agenda and id_tramite:
            qs = Ficha.objects.filter(id_agenda=id_agenda, id_tramite_servicio=id_tramite)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Este trámite ya está registrado en la agenda especificada.")

        solicitudes = attrs.get('solicitudes_recibidas_semestre_anterior', getattr(self.instance, 'solicitudes_recibidas_semestre_anterior', None))
        resoluciones = attrs.get('resoluciones_positivas', getattr(self.instance, 'resoluciones_positivas', None))

        if solicitudes is not None and resoluciones is not None:
            if resoluciones > solicitudes:
                raise serializers.ValidationError({
                    "resoluciones_positivas": "Las resoluciones positivas no pueden superar a las solicitudes recibidas en el semestre anterior."
                })

        return attrs

    def create(self, validated_data):
        niveles_ids = validated_data.pop('niveles_digitalizacion_ids', None)
        ficha = super().create(validated_data)
        if niveles_ids is not None:
            self._sync_niveles(ficha, niveles_ids)
        return ficha

    def update(self, instance, validated_data):
        niveles_ids = validated_data.pop('niveles_digitalizacion_ids', None)
        ficha = super().update(instance, validated_data)
        if niveles_ids is not None:
            self._sync_niveles(ficha, niveles_ids)
        return ficha

    def _sync_niveles(self, ficha, niveles_ids):
        ficha.niveles_digitalizacion.all().delete()
        for n_val in niveles_ids:
            try:
                FichaNivelDigitalizacion.objects.create(id_ficha=ficha, nivel=int(n_val))
            except (ValueError, TypeError):
                pass
