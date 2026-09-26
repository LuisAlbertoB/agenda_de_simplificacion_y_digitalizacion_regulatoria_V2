from django.db import transaction
from src.models import Ficha
from src.models import Cobro, FichaHasAccion, CronogramaActividad, FichaNivelDigitalizacion


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
        niveles_digitalizacion_ids = payload.pop('niveles_digitalizacion_ids', [])
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
            conceptos_con_fundamento=payload.get('conceptos_con_fundamento', []),
            numero_requisitos=payload.get('numero_requisitos'),
            poblacion_prioritaria_atencion_preferente=payload.get('poblacion_prioritaria_atencion_preferente', False),
            solicitudes_recibidas_semestre_anterior=payload.get('solicitudes_recibidas_semestre_anterior'),
            resoluciones_positivas=payload.get('resoluciones_positivas'),
            cantidad_personas_intervienen=payload.get('cantidad_personas_intervienen'),
            areas_administrativas_interfieren=payload.get('areas_administrativas_interfieren'),
            habile_ventanilla_presencial=payload.get('habile_ventanilla_presencial', False),
            habile_portal_web_municipal=payload.get('habile_portal_web_municipal', False),
            habile_app_mobile=payload.get('habile_app_mobile', False),
            habile_linea_telefonica=payload.get('habile_linea_telefonica', False),
            cuellos_de_botella=payload.get('cuellos_de_botella'),
            requisitos_sin_valor=payload.get('requisitos_sin_valor'),
            propuestas_de_mejora=payload.get('propuestas_de_mejora'),
            analisis_requisitos_json=payload.get('analisis_requisitos_json', []),
            regulacion_fundamenta_existencia_tramite=payload.get('regulacion_fundamenta_existencia_tramite'),
            regulacion_faculta_organo=payload.get('regulacion_faculta_organo'),
            fundamento_en_ley_de_ingresos=payload.get('fundamento_en_ley_de_ingresos'),
            unidad_de_cobro=payload.get('unidad_de_cobro'),
            importe_tramite=payload.get('importe_tramite'),
            tipo_tramite_dirigido=payload.get('tipo_tramite_dirigido'),
            formas_de_pago=payload.get('formas_de_pago', []),
            nivel_digitalizacion_actual=payload.get('nivel_digitalizacion_actual'),
            propuesta_mejora_transaccion_tecnologica=payload.get('propuesta_mejora_transaccion_tecnologica'),
            status=payload.get('status', 0),
            created_by=user if (user and user.is_authenticated) else None
        )

        # Vincular Niveles de Digitalización (FichaNivelDigitalizacion)
        from src.models import FichaNivelDigitalizacion
        for n_id in niveles_digitalizacion_ids:
            try:
                n_val = int(n_id)
                FichaNivelDigitalizacion.objects.get_or_create(
                    id_ficha=ficha,
                    nivel=n_val
                )
            except (ValueError, TypeError):
                pass

        # Vincular Acciones (FichaHasAccion)
        for acc_id in id_accion_ids:
            if Accion.objects.filter(pk=acc_id).exists():
                FichaHasAccion.objects.get_or_create(
                    id_ficha=ficha,
                    id_accion_id=acc_id,
                    defaults={'created_by': user if (user and user.is_authenticated) else None}
                )

        # Registrar elementos de Cronograma por Actividad
        from src.models import Actividad
        for item in cronograma_items:
            act_id = item.get('id_actividad_id') or item.get('id_actividad')
            inicio = item.get('num_mes_inicio_plazo', 1)
            final = item.get('num_mes_final_plazo', 6)
            if act_id and Actividad.objects.filter(pk=act_id).exists():
                CronogramaActividad.objects.create(
                    id_ficha=ficha,
                    id_actividad_id=act_id,
                    num_mes_inicio_plazo=inicio,
                    num_mes_final_plazo=final,
                    created_by=user if (user and user.is_authenticated) else None
                )

        return ficha

    @staticmethod
    def obtener_paquete_documental(ficha):
        """
        Consolida en un solo dict todos los datos necesarios para generar
        el documento oficial imprimible FASD (6 hojas: FASD 07, 08, 09, 03, 04, 05).

        Devuelve:
          - Todos los campos propios de la ficha
          - agenda: Agenda completa con id_dependencia anidada y 6 campos de firmantes
          - tramite: TramiteOServicio completo
          - cobros: Lista de Cobro filtrados por esta ficha
          - acciones: Lista de FichaHasAccion, cada uno con la acción completa, sus
                      actividades, entregables y cronograma (inicio/fin) para esta ficha
          - niveles_digitalizacion: niveles de madurez digital de la ficha
        """
        from src.services.agenda_serializer import AgendaSerializer
        from src.services.tramite_o_servicio_serializer import TramiteOServicioSerializer
        from src.services.cobro_serializer import CobroSerializer
        from src.services.ficha_nivel_digitalizacion_serializer import FichaNivelDigitalizacionSerializer

        # ── 1. Datos propios de la Ficha ──────────────────────────────────────
        ficha_data = {
            'id_ficha': ficha.id_ficha,
            'solicitud_tipo': ficha.solicitud_tipo,
            'plazo_maximo_resolucion_dias': ficha.plazo_maximo_resolucion_dias,
            'is_dia_habil_o_inhabil': ficha.is_dia_habil_o_inhabil,
            'vigencia_del_documento_obtenido': ficha.vigencia_del_documento_obtenido,
            'conceptos_con_fundamento': ficha.conceptos_con_fundamento,
            'numero_requisitos': ficha.numero_requisitos,
            'poblacion_prioritaria_atencion_preferente': ficha.poblacion_prioritaria_atencion_preferente,
            'solicitudes_recibidas_semestre_anterior': ficha.solicitudes_recibidas_semestre_anterior,
            'resoluciones_positivas': ficha.resoluciones_positivas,
            'cantidad_personas_intervienen': ficha.cantidad_personas_intervienen,
            'areas_administrativas_interfieren': ficha.areas_administrativas_interfieren,
            'condiciones_o_criterios_de_resolucion': ficha.condiciones_o_criterios_de_resolucion,
            'habile_ventanilla_presencial': ficha.habile_ventanilla_presencial,
            'habile_portal_web_municipal': ficha.habile_portal_web_municipal,
            'habile_app_mobile': ficha.habile_app_mobile,
            'habile_linea_telefonica': ficha.habile_linea_telefonica,
            'cuellos_de_botella': ficha.cuellos_de_botella,
            'requisitos_sin_valor': ficha.requisitos_sin_valor,
            'propuestas_de_mejora': ficha.propuestas_de_mejora,
            'analisis_requisitos_json': ficha.analisis_requisitos_json or [],
            'regulacion_fundamenta_existencia_tramite': ficha.regulacion_fundamenta_existencia_tramite,
            'regulacion_faculta_organo': ficha.regulacion_faculta_organo,
            'fundamento_en_ley_de_ingresos': ficha.fundamento_en_ley_de_ingresos,
            'unidad_de_cobro': ficha.unidad_de_cobro,
            'importe_tramite': ficha.importe_tramite,
            'tipo_tramite_dirigido': ficha.tipo_tramite_dirigido,
            'formas_de_pago': ficha.formas_de_pago or [],
            'nivel_digitalizacion_actual': ficha.nivel_digitalizacion_actual,
            'propuesta_mejora_transaccion_tecnologica': ficha.propuesta_mejora_transaccion_tecnologica,
            'status': ficha.status,
            'valor_priorizacion': FichaService.calcular_puntaje_priorizacion(ficha).get('puntaje_total', 0),
            'created_at': ficha.created_at.isoformat() if ficha.created_at else None,
            'updated_at': ficha.updated_at.isoformat() if ficha.updated_at else None,
        }

        # ── 2. Agenda completa con dependencia y firmantes ────────────────────
        agenda = ficha.id_agenda
        agenda_data = AgendaSerializer(agenda).data

        # ── 3. Trámite o Servicio completo ─────────────────────────────────────
        tramite = ficha.id_tramite_servicio
        tramite_data = TramiteOServicioSerializer(tramite).data

        # ── 4. Cobros filtrados por esta ficha ─────────────────────────────────
        cobros_qs = Cobro.objects.filter(id_ficha=ficha).order_by('id_cobros')
        cobros_data = CobroSerializer(cobros_qs, many=True).data

        # ── 5. Acciones vinculadas con actividades, entregables y cronograma ──
        # Construimos un índice de cronograma (id_actividad -> {inicio, fin})
        cronograma_qs = CronogramaActividad.objects.filter(id_ficha=ficha).select_related('id_actividad')
        cronograma_index = {}
        for cr in cronograma_qs:
            act_id = cr.id_actividad_id
            # Si hay varios registros para la misma actividad, tomamos el primero
            if act_id not in cronograma_index:
                cronograma_index[act_id] = {
                    'num_mes_inicio_plazo': cr.num_mes_inicio_plazo,
                    'num_mes_final_plazo': cr.num_mes_final_plazo,
                }

        fichas_has_acciones_qs = (
            FichaHasAccion.objects
            .filter(id_ficha=ficha)
            .select_related('id_accion')
            .prefetch_related('id_accion__actividades__entregables')
            .order_by('id_accion__clave')
        )

        acciones_data = []
        for fha in fichas_has_acciones_qs:
            accion = fha.id_accion
            actividades_list = []
            for actividad in accion.actividades.all().prefetch_related('entregables').order_by('clave'):
                entregables_list = [
                    {
                        'id_entregable': e.id_entregable,
                        'clave': e.clave,
                        'titulo': e.titulo,
                        'descripcion': e.descripcion,
                        'status': e.status,
                    }
                    for e in actividad.entregables.all().order_by('clave')
                ]
                cronograma_act = cronograma_index.get(actividad.id_actividades, {
                    'num_mes_inicio_plazo': None,
                    'num_mes_final_plazo': None,
                })
                actividades_list.append({
                    'id_actividades': actividad.id_actividades,
                    'clave': actividad.clave,
                    'titulo': actividad.titulo,
                    'descripcion': actividad.descripcion,
                    'entregables': entregables_list,
                    'cronograma': cronograma_act,
                })

            acciones_data.append({
                'id_fichas_has_accion': fha.id_fichas_has_accion,
                'id_accion': {
                    'id_accion': accion.id_accion,
                    'simplificacion_o_digitalizacion': accion.simplificacion_o_digitalizacion,
                    'clave': accion.clave,
                    'titulo': accion.titulo,
                    'descripcion': accion.descripcion,
                },
                'actividades': actividades_list,
            })

        # ── 6. Niveles de digitalización ──────────────────────────────────────
        niveles_qs = FichaNivelDigitalizacion.objects.filter(id_ficha=ficha).order_by('nivel')
        niveles_data = FichaNivelDigitalizacionSerializer(niveles_qs, many=True).data

        return {
            **ficha_data,
            'agenda': agenda_data,
            'tramite': tramite_data,
            'cobros': list(cobros_data),
            'acciones': acciones_data,
            'niveles_digitalizacion': list(niveles_data),
        }
