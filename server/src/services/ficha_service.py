from django.db import transaction
from src.models import Ficha


class FichaService:
    """
    Capa de servicio para la entidad Ficha (diagnóstico).
    
    catálogo de documentos oficiales FASD (para próximo sprint de exportación documental):
      - FASD 01: Priorización de Trámites o Servicios (Ficha / Agenda) -> Alimentado por Ficha + calcular_puntaje_priorizacion
      - FASD 02: Ficha Técnica del Análisis a Simplificar (Ficha) -> Alimentado por Ficha, TramiteOServicio
      - FASD 03: Acciones de Simplificación y Digitalización (Ficha) -> Alimentado por FichasHasAcciones, Accion
      - FASD 04: Cronología de Integración — Simplificación (Ficha) -> Alimentado por CronogramaActividad (Simplificación)
      - FASD 05: Cronología de Integración — Digitalización (Ficha) -> Alimentado por CronogramaActividad (Digitalización)
      - FASD 06: Diagnóstico del Trámite o Servicio (Ficha) -> Alimentado por Ficha (Cuellos de botella, Matriz de Madurez)
      - Agregado: Agenda de Simplificación (Agenda) -> Consolidado FASD 03/04 de la Agenda
      - Agregado: Agenda de Digitalización (Agenda) -> Consolidado FASD 03/05 de la Agenda
      - Agregado: Agenda Completa / Maestro (Agenda) -> Paquete Zip con todos los PDFs anteriores
    """

    @staticmethod
    def obtener_todos():
        return Ficha.objects.select_related('id_agenda', 'id_tramite_servicio').all()

    @staticmethod
    def obtener_por_id(id_ficha):
        try:
            return Ficha.objects.select_related('id_agenda', 'id_tramite_servicio').get(pk=id_ficha)
        except Ficha.DoesNotExist:
            return None

    @staticmethod
    def calcular_puntaje_priorizacion(ficha):
        """
        Calcula el puntaje de priorización de una ficha usando los factores portables del modelo FASD 01:
          - Plazo de resolución (hasta 15 pts)
          - Población vulnerable (20 pts si True)
          - Volumen de solicitudes (hasta 15 pts)
          - Fundamento jurídico (aproximación de 2 sub-factores, 20 pts c/u, hasta 40 pts)
        
        Devuelve un diccionario con el total, desglose por factor, y la lista de factores no evaluados.
        """
        desglose = {}

        # 1. Plazo de resolución
        plazo = ficha.plazo_maximo_resolucion_dias
        if plazo is None:
            pts_plazo = 0
        elif plazo > 15:
            pts_plazo = 15
        elif plazo >= 6:
            pts_plazo = 10
        elif plazo >= 1:
            pts_plazo = 5
        else:
            pts_plazo = 1  # 0 días (inmediato)
        desglose['plazo_resolucion'] = {
            'valor': plazo,
            'puntaje': pts_plazo,
            'maximo': 15,
            'descripcion': f"{plazo} días máximos" if plazo is not None else "Sin especificar"
        }

        # 2. Población vulnerable
        vulnerable = bool(ficha.poblacion_prioritaria_atencion_preferente)
        pts_vulnerable = 20 if vulnerable else 0
        desglose['poblacion_vulnerable'] = {
            'valor': vulnerable,
            'puntaje': pts_vulnerable,
            'maximo': 20,
            'descripcion': "Atención a grupos prioritarios/vulnerables" if vulnerable else "Población general"
        }

        # 3. Volumen de solicitudes
        solicitudes = ficha.solicitudes_recibidas_semestre_anterior
        if solicitudes is None:
            pts_volumen = 0
        elif solicitudes > 500:
            pts_volumen = 15
        elif solicitudes >= 100:
            pts_volumen = 10
        else:
            pts_volumen = 5
        desglose['volumen_solicitudes'] = {
            'valor': solicitudes,
            'puntaje': pts_volumen,
            'maximo': 15,
            'descripcion': f"{solicitudes} solicitudes semestre anterior" if solicitudes is not None else "Sin datos"
        }

        # 4. Fundamento jurídico (Aproximación de 2 sub-factores conservadores)
        has_regulacion = bool(ficha.regulacion_fundamenta_existencia_tramite and ficha.regulacion_fundamenta_existencia_tramite.strip())
        has_ley_ingresos = bool(ficha.fundamento_en_ley_de_ingresos and ficha.fundamento_en_ley_de_ingresos.strip())
        pts_juridico = (20 if has_regulacion else 0) + (20 if has_ley_ingresos else 0)
        desglose['fundamento_juridico_aproximado'] = {
            'regulacion_existencia': has_regulacion,
            'ley_ingresos': has_ley_ingresos,
            'puntaje': pts_juridico,
            'maximo': 40,
            'descripcion': "Evaluados 2 sub-factores de fundamento jurídico disponibles en el canon"
        }

        puntaje_total = pts_plazo + pts_vulnerable + pts_volumen + pts_juridico

        factores_no_evaluados = [
            "Tipo de gestión (no portable por cambio de categorías 0-4 no documentadas en el canon)",
            "Tipo de solicitud (no portable por cambio semántico de categorías 0-3)",
            "Número de requisitos vinculados (no portable por falta de entidad Requisitos en el canon)",
            "Sub-factores jurídicos específicos (2 de 5 evaluados por menor granularidad en el canon)"
        ]

        return {
            'id_ficha': ficha.id_ficha,
            'puntaje_total': puntaje_total,
            'puntaje_maximo_evaluado': 90,
            'desglose': desglose,
            'factores_no_evaluados': factores_no_evaluados
        }

    @staticmethod
    @transaction.atomic
    def registrar_ficha_con_cronograma(payload, user=None):
        """
        Servicio transaccional que valida prerrequisitos (Agenda y Trámite/Servicio),
        crea la Ficha, asocia las Acciones seleccionadas (FichaHasAccion)
        y sincroniza los plazos del CronogramaActividad por acción.
        """
        from django.db import transaction
        from rest_framework import serializers
        from src.models import Ficha, Agenda, TramiteOServicio, Accion, FichaHasAccion, CronogramaActividad

        id_agenda_id = payload.get('id_agenda_id')
        id_tramite_servicio_id = payload.get('id_tramite_servicio_id')

        if not id_agenda_id or not Agenda.objects.filter(pk=id_agenda_id).exists():
            raise serializers.ValidationError({"id_agenda_id": "Debe especificar una Agenda existente válida."})

        if not id_tramite_servicio_id or not TramiteOServicio.objects.filter(pk=id_tramite_servicio_id).exists():
            raise serializers.ValidationError({"id_tramite_servicio_id": "Debe especificar un Trámite o Servicio existente válido."})

        # Extraer listas compuestas del payload
        id_accion_ids = payload.pop('id_accion_ids', [])
        cronograma_items = payload.pop('cronograma_items', [])

        # Crear Ficha principal
        ficha_serializer_data = {**payload, 'created_by': user} if user else payload
        ficha = Ficha.objects.create(
            id_agenda_id=id_agenda_id,
            id_tramite_servicio_id=id_tramite_servicio_id,
            solicitud_tipo=payload.get('solicitud_tipo'),
            plazo_maximo_resolucion_dias=payload.get('plazo_maximo_resolucion_dias'),
            is_dia_habil_o_inhabil=payload.get('is_dia_habil_o_inhabil', True),
            vigencia_del_documento_obtenido=payload.get('vigencia_del_documento_obtenido'),
            poblacion_prioritaria_atencion_preferente=payload.get('poblacion_prioritaria_atencion_preferente', False),
            solicitudes_recibidas_semestre_anterior=payload.get('solicitudes_recibidas_semestre_anterior'),
            resoluciones_positivas=payload.get('resoluciones_positivas'),
            areas_administrativas_interfieren=payload.get('areas_administrativas_interfieren'),
            habile_ventanilla_presencial=payload.get('habile_ventanilla_presencial', False),
            habile_portal_web_municipal=payload.get('habile_portal_web_municipal', False),
            habile_app_mobile=payload.get('habile_app_mobile', False),
            habile_linea_telefonica=payload.get('habile_linea_telefonica', False),
            cuellos_de_botella=payload.get('cuellos_de_botella'),
            requisitos_sin_valor=payload.get('requisitos_sin_valor'),
            propuestas_de_mejora=payload.get('propuestas_de_mejora'),
            regulacion_fundamenta_existencia_tramite=payload.get('regulacion_fundamenta_existencia_tramite'),
            fundamento_en_ley_de_ingresos=payload.get('fundamento_en_ley_de_ingresos'),
            nivel_digitalizacion_actual=payload.get('nivel_digitalizacion_actual'),
            propuesta_mejora_transaccion_tecnologica=payload.get('propuesta_mejora_transaccion_tecnologica'),
            status=payload.get('status', 0),
            created_by=user if (user and user.is_authenticated) else None
        )

        # Vincular Acciones (FichaHasAccion)
        for acc_id in id_accion_ids:
            if Accion.objects.filter(pk=acc_id).exists():
                FichaHasAccion.objects.get_or_create(
                    id_ficha=ficha,
                    id_accion_id=acc_id,
                    defaults={'created_by': user if (user and user.is_authenticated) else None}
                )

        # Registrar elementos de Cronograma
        for item in cronograma_items:
            acc_id = item.get('id_accion_id')
            inicio = item.get('num_mes_inicio_plazo', 1)
            final = item.get('num_mes_final_plazo', 6)
            if acc_id and Accion.objects.filter(pk=acc_id).exists():
                CronogramaActividad.objects.create(
                    id_ficha=ficha,
                    id_accion_id=acc_id,
                    num_mes_inicio_plazo=inicio,
                    num_mes_final_plazo=final,
                    created_by=user if (user and user.is_authenticated) else None
                )

        return ficha
