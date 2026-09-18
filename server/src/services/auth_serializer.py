from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        """Agrega claims personalizados al payload del JWT."""
        token = super().get_token(user)

        # Claims personalizados visibles al decodificar el token
        token['correo_electronico'] = user.correo_electronico
        token['nombres'] = user.nombres
        token['apellido1'] = user.apellido1
        token['id_role'] = user.id_role_id
        token['id_dependencia'] = user.id_dependencia_id
        token['is_staff'] = user.is_staff

        return token

    def validate(self, attrs):
        """Enriquece la respuesta JSON con datos del usuario autenticado."""
        data = super().validate(attrs)

        # Datos adicionales en la respuesta (no en el token, sino en el JSON)
        data['user'] = {
            'id_usuario': self.user.id_usuario,
            'correo_electronico': self.user.correo_electronico,
            'nombre_completo': self.user.nombre_completo,
            'id_role': self.user.id_role_id,
            'role_clave': self.user.id_role.clave if self.user.id_role else None,
            'id_dependencia': self.user.id_dependencia_id,
            'is_staff': self.user.is_staff,
        }

        return data
