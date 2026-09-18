from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, serializers
from src.models import Agenda
from src.services import AgendaSerializer, AgendaService


def es_usuario_admin(user):
    """Auxiliar para verificar si el usuario tiene privilegios de administrador."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    if user.id_role:
        clave_role = (user.id_role.clave or '').upper()
        if 'ADMIN' in clave_role or 'SUPERADMIN' in clave_role:
            return True
    return False


class AgendaViewSet(ModelViewSet):
    """ViewSet para la gestión de Agendas de Simplificación."""
    serializer_class = AgendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AgendaService.obtener_todos()

    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {'created_by': user}

        val_dep = serializer.validated_data.get('id_dependencia')
        if not val_dep or not es_usuario_admin(user):
            if user and user.id_dependencia:
                kwargs['id_dependencia'] = user.id_dependencia
            elif not es_usuario_admin(user):
                raise serializers.ValidationError({
                    "id_dependencia": "El usuario autenticado no pertenece a ninguna dependencia."
                })
            elif not val_dep:
                raise serializers.ValidationError({
                    "id_dependencia_id": "Debe especificar la dependencia a la que pertenece la agenda."
                })

        serializer.save(**kwargs)

    def perform_update(self, serializer):
        user = self.request.user
        kwargs = {}

        # Regla de propiedad por dependencia: si no es admin, forzar la dependencia del usuario
        if not es_usuario_admin(user):
            if not user.id_dependencia:
                raise serializers.ValidationError({
                    "id_dependencia": "El usuario autenticado no pertenece a ninguna dependencia."
                })
            kwargs['id_dependencia'] = user.id_dependencia

        serializer.save(**kwargs)

    @action(detail=True, methods=['patch'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
        """
        Acción custom para la transición controlada de estado de una agenda (0..4).
        0=Borrador, 1=Enviada, 2=Aprobada, 3=Observada, 4=Rechazada.
        """
        agenda = self.get_object()
        nuevo_estado = request.data.get('status')

        if nuevo_estado is None:
            return Response(
                {"detail": "El campo 'status' es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            nuevo_estado_int = int(nuevo_estado)
        except (ValueError, TypeError):
            return Response(
                {"detail": "El campo 'status' debe ser un número entero entre 0 y 4."},
                status=status.HTTP_400_BAD_REQUEST
            )

        estados_validos = [choice[0] for choice in Agenda.STATUS_CHOICES]
        if nuevo_estado_int not in estados_validos:
            return Response(
                {"detail": f"Estado inválido '{nuevo_estado}'. Los valores permitidos son {estados_validos} (0=Borrador, 1=Enviada, 2=Aprobada, 3=Observada, 4=Rechazada)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        agenda.status = nuevo_estado_int
        agenda.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(agenda)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='consolidado')
    def consolidado(self, request, pk=None):
        """Devuelve la vista consolidada de la agenda con sus fichas, acciones y cronogramas."""
        agenda_dict = AgendaService.obtener_consolidado(pk)
        if not agenda_dict:
            return Response({"detail": "Agenda no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        return Response(agenda_dict, status=status.HTTP_200_OK)
