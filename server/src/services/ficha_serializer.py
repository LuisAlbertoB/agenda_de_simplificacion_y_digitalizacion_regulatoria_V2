from rest_framework import serializers
from src.models import Ficha, Agenda, TramiteOServicio
from src.services.tramite_o_servicio_serializer import TramiteOServicioSerializer


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
            'poblacion_prioritaria_atencion_preferente',
            'solicitudes_recibidas_semestre_anterior',
            'resoluciones_positivas',
            'areas_administrativas_interfieren',
            'condiciones_o_criterios_de_resolucion',
            'habile_ventanilla_presencial',
            'habile_portal_web_municipal',
            'habile_app_mobile',
            'habile_linea_telefonica',
            'cuellos_de_botella',
            'requisitos_sin_valor',
            'propuestas_de_mejora',
            'regulacion_fundamenta_existencia_tramite',
            'fundamento_en_ley_de_ingresos',
            'nivel_digitalizacion_actual',
            'propuesta_mejora_transaccion_tecnologica',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_ficha', 'created_by_id', 'created_at', 'updated_at']

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
