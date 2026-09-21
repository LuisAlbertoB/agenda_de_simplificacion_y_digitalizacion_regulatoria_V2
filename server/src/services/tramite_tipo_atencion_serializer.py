from rest_framework import serializers
from src.models import TramiteTipoAtencion


class TramiteTipoAtencionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TramiteTipoAtencion
        fields = ['id_tramite_tipo_atencion', 'tipo', 'created_at']
        read_only_fields = ['id_tramite_tipo_atencion', 'created_at']
