from rest_framework import serializers
from src.models import FichaNivelDigitalizacion


class FichaNivelDigitalizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaNivelDigitalizacion
        fields = ['id_ficha_nivel_digitalizacion', 'nivel', 'created_at']
        read_only_fields = ['id_ficha_nivel_digitalizacion', 'created_at']
