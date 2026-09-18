from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from src.services import FichaSerializer, FichaService


class FichaViewSet(ModelViewSet):
    """ViewSet para la gestión de Fichas de diagnósticos."""
    serializer_class = FichaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FichaService.obtener_todos()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='priorizacion')
    def priorizacion(self, request, pk=None):
        """Devuelve el cálculo de priorización parcial (FASD 01) para una ficha."""
        ficha = self.get_object()
        resultado = FichaService.calcular_puntaje_priorizacion(ficha)
        return Response(resultado, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='registrar-con-cronograma')
    def registrar_con_cronograma(self, request):
        """
        Endpoint para el registro transaccional del Asistente (Wizard) de 4 Pasos.
        Crea la Ficha, FichaHasAccion y CronogramaActividad en una sola transacción atómica.
        """
        user = request.user if (request.user and request.user.is_authenticated) else None
        ficha = FichaService.registrar_ficha_con_cronograma(request.data, user=user)
        serializer = self.get_serializer(ficha)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
