from django.db import models


class Ficha(models.Model):
    """
    Ficha de diagnóstico y digitalización de un trámite/servicio dentro de una agenda.
    Es la entidad más grande y compleja del modelo.
    Tabla: fichas
    """

    # Tipo de solicitud (SQL comentario)
    SOLICITUD_NO_TIENE = 0
    SOLICITUD_ESCRITO_LIBRE = 1
    SOLICITUD_FORMATO_ESPECIFICO = 2
    SOLICITUD_FORMATO_UNICO = 3
    SOLICITUD_TIPO_CHOICES = [
        (SOLICITUD_NO_TIENE,           'No tiene'),
        (SOLICITUD_ESCRITO_LIBRE,      'Escrito libre'),
        (SOLICITUD_FORMATO_ESPECIFICO, 'Formato específico'),
        (SOLICITUD_FORMATO_UNICO,      'Formato único'),
    ]

    # Nivel de digitalización actual (SQL comentario)
    NIVEL_PRESENCIAL = 0
    NIVEL_1_INFORMATIVO = 1
    NIVEL_2_FORMATOS = 2
    NIVEL_3_INTERACTIVO = 3
    NIVEL_4_DIGITAL_END_TO_END = 4
    NIVEL_DIGITALIZACION_CHOICES = [
        (NIVEL_PRESENCIAL,           'Presencial (Legacy)'),
        (NIVEL_1_INFORMATIVO,        'Nivel 1: La información del trámite o servicio está publicada en medios electrónicos'),
        (NIVEL_2_FORMATOS,           'Nivel 2: Los formatos del trámite o servicio están disponibles electrónicamente'),
        (NIVEL_3_INTERACTIVO,        'Nivel 3: El usuario puede iniciar la gestión, recibir o reenviar la información del trámite'),
        (NIVEL_4_DIGITAL_END_TO_END, 'Nivel 4: El trámite o servicio se gestiona desde el inicio hasta el final a través de un medio electrónico'),
    ]

    # Status de la ficha (SQL: status INT DEFAULT 0 CHECK (status >= 0))
    STATUS_BORRADOR = 0
    STATUS_REVISION_PENDIENTE = 1
    STATUS_APROBADA = 2
    STATUS_RECHAZADA = 3
    STATUS_CHOICES = [
        (STATUS_BORRADOR,           'Borrador'),
        (STATUS_REVISION_PENDIENTE, 'Revisión pendiente'),
        (STATUS_APROBADA,           'Aprobada'),
        (STATUS_RECHAZADA,          'Rechazada'),
    ]

    id_ficha = models.BigAutoField(
        primary_key=True,
        db_column='id_ficha',
        verbose_name="ID de Ficha"
    )

    # ── Relaciones principales ──────────────────────────────────────────────────
    id_agenda = models.ForeignKey(
        'src.Agenda',
        on_delete=models.CASCADE,
        related_name='fichas',
        db_column='id_agenda',
        verbose_name="Agenda",
        help_text="Agenda a la que pertenece esta ficha (ON DELETE CASCADE)"
    )
    id_tramite_servicio = models.ForeignKey(
        'src.TramiteOServicio',
        on_delete=models.PROTECT,
        related_name='fichas',
        db_column='id_tramite_servicio',
        verbose_name="Trámite o Servicio",
        help_text="Trámite o servicio diagnosticado en esta ficha"
    )

    # ── Información General del Trámite o Servicio ─────────────────────────────
    solicitud_tipo = models.IntegerField(
        choices=SOLICITUD_TIPO_CHOICES,
        blank=True,
        null=True,
        verbose_name="Tipo de solicitud",
        help_text="0=No tiene, 1=Escrito libre, 2=Formato específico, 3=Formato único"
    )
    plazo_maximo_resolucion_dias = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Plazo máximo de resolución (días)",
        help_text="Número de días máximo para la resolución del trámite (>= 0)"
    )
    is_dia_habil_o_inhabil = models.BooleanField(
        blank=True,
        null=True,
        verbose_name="¿Días hábiles?",
        help_text="True = días hábiles, False = días naturales/inhábiles"
    )
    vigencia_del_documento_obtenido = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Vigencia del documento obtenido",
        help_text="Descripción de la vigencia del documento que emite el trámite/servicio"
    )
    conceptos_con_fundamento = models.JSONField(
        default=list,
        blank=True,
        null=True,
        verbose_name="Conceptos con fundamento",
        help_text="Lista de conceptos fundamentados (tramite_o_servicio, requisitos, plazo_de_resolucion, vigencia)"
    )
    numero_requisitos = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Número de requisitos",
        help_text="Número de requisitos que posee el trámite/servicio"
    )
    poblacion_prioritaria_atencion_preferente = models.BooleanField(
        blank=True,
        null=True,
        verbose_name="Población prioritaria / atención preferente",
        help_text="True = atiende a personas vulnerables o con atención preferente"
    )
    solicitudes_recibidas_semestre_anterior = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Solicitudes recibidas ejercicio anterior",
        help_text="Número de solicitudes recibidas en el ejercicio inmediato anterior (>= 0)"
    )
    resoluciones_positivas = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Resoluciones positivas",
        help_text="Número de resoluciones positivas del ejercicio anterior (>= 0)"
    )
    cantidad_personas_intervienen = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Cantidad de personas que intervienen",
        help_text="Número de personas que intervienen en el proceso (>= 0)"
    )
    areas_administrativas_interfieren = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Áreas administrativas que intervienen",
        help_text="Número de áreas administrativas involucradas en el proceso (>= 0)"
    )
    condiciones_o_criterios_de_resolucion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Condiciones o criterios de resolución",
        help_text="Descripción de las condiciones o criterios para la resolución"
    )

    # ── Diagnóstico Operativo y Medios de Atención ─────────────────────────────
    habile_ventanilla_presencial = models.BooleanField(
        default=False,
        verbose_name="Habilitado: ventanilla presencial",
        help_text="True = el trámite/servicio se puede realizar en ventanilla presencial"
    )
    habile_portal_web_municipal = models.BooleanField(
        default=False,
        verbose_name="Habilitado: portal web municipal",
        help_text="True = el trámite/servicio se puede realizar por portal web"
    )
    habile_app_mobile = models.BooleanField(
        default=False,
        verbose_name="Habilitado: app móvil",
        help_text="True = el trámite/servicio se puede realizar por aplicación móvil"
    )
    habile_linea_telefonica = models.BooleanField(
        default=False,
        verbose_name="Habilitado: línea telefónica",
        help_text="True = el trámite/servicio se puede realizar por teléfono"
    )

    # ── Análisis Operativo y Requisitos ─────────────────────────────────────────
    cuellos_de_botella = models.TextField(
        blank=True,
        null=True,
        verbose_name="Cuellos de botella",
        help_text="¿Dónde están los cuellos de botella generados?"
    )
    requisitos_sin_valor = models.TextField(
        blank=True,
        null=True,
        verbose_name="Requisitos sin valor",
        help_text="¿Qué requisitos no agregan valor al resolutivo del trámite?"
    )
    propuestas_de_mejora = models.TextField(
        blank=True,
        null=True,
        verbose_name="Propuestas de mejora",
        help_text="¿Indique propuesta de mejora de los problemas detectados?"
    )
    analisis_requisitos_json = models.JSONField(
        default=list,
        blank=True,
        null=True,
        verbose_name="Análisis de requisitos (Clave-Valor)",
        help_text="Lista de objetos {requisito: string, observacion: string}"
    )

    # ── Fundamentos Jurídicos y Esquema de Cobro ───────────────────────────────
    regulacion_fundamenta_existencia_tramite = models.TextField(
        blank=True,
        null=True,
        verbose_name="Regulación que fundamenta el trámite",
        help_text="Nombre, artículo y fracción de la regulación en la que se fundamenta el trámite o servicio"
    )
    regulacion_faculta_organo = models.TextField(
        blank=True,
        null=True,
        verbose_name="Regulación que faculta al órgano administrativo",
        help_text="Nombre de la regulación que faculta al órgano administrativo"
    )
    fundamento_en_ley_de_ingresos = models.TextField(
        blank=True,
        null=True,
        verbose_name="Fundamento en Ley de Ingresos",
        help_text="Referencia al fundamento en la Ley de Ingresos"
    )
    unidad_de_cobro = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Unidad de cobro",
        help_text="UMAs, Moneda Nacional o Gratuito"
    )
    importe_tramite = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Importe del trámite",
        help_text="Importe expresado en string"
    )
    tipo_tramite_dirigido = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Tipo de trámite o servicio",
        help_text="Ciudadano, Empresarial o Ambos"
    )
    formas_de_pago = models.JSONField(
        default=list,
        blank=True,
        null=True,
        verbose_name="Formas de pago",
        help_text="Caja propia, Bancos, Banca electrónica, Otros"
    )

    # ── Matriz de Diagnóstico y Nivel de Madurez Digital ──────────────────────
    nivel_digitalizacion_actual = models.IntegerField(
        choices=NIVEL_DIGITALIZACION_CHOICES,
        blank=True,
        null=True,
        verbose_name="Nivel de digitalización actual",
        help_text="1=Nivel 1 Informativo, 2=Nivel 2 Formatos, 3=Nivel 3 Interactivo, 4=Nivel 4 Digital End-to-End"
    )
    propuesta_mejora_transaccion_tecnologica = models.TextField(
        blank=True,
        null=True,
        verbose_name="Propuesta de mejora tecnológica",
        help_text="Propuesta de mejora para la transacción tecnológica del trámite/servicio"
    )

    # ── Estado General de la Ficha ─────────────────────────────────────────────
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        default=STATUS_BORRADOR,
        verbose_name="Estado de la ficha",
        help_text="0=borrador, 1=revisión pendiente, 2=aprobada, 3=rechazada"
    )

    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fichas_creadas',
        db_column='created_by_id',
        verbose_name="Creada por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'fichas'
        verbose_name = 'Ficha'
        verbose_name_plural = 'Fichas'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(solicitud_tipo__isnull=True) | (models.Q(solicitud_tipo__gte=0) & models.Q(solicitud_tipo__lte=3)),
                name='chk_fichas_solicitud_tipo'
            ),
            models.CheckConstraint(
                condition=models.Q(plazo_maximo_resolucion_dias__isnull=True) | models.Q(plazo_maximo_resolucion_dias__gte=0),
                name='chk_fichas_plazo_maximo'
            ),
            models.CheckConstraint(
                condition=models.Q(solicitudes_recibidas_semestre_anterior__isnull=True) | models.Q(solicitudes_recibidas_semestre_anterior__gte=0),
                name='chk_fichas_solicitudes_recibidas'
            ),
            models.CheckConstraint(
                condition=models.Q(resoluciones_positivas__isnull=True) | models.Q(resoluciones_positivas__gte=0),
                name='chk_fichas_resoluciones_positivas'
            ),
            models.CheckConstraint(
                condition=models.Q(areas_administrativas_interfieren__isnull=True) | models.Q(areas_administrativas_interfieren__gte=0),
                name='chk_fichas_areas_admin'
            ),
            models.CheckConstraint(
                condition=models.Q(nivel_digitalizacion_actual__isnull=True) | (models.Q(nivel_digitalizacion_actual__gte=0) & models.Q(nivel_digitalizacion_actual__lte=4)),
                name='chk_fichas_nivel_digitalizacion'
            ),
            models.CheckConstraint(
                condition=models.Q(status__gte=0),
                name='chk_fichas_status'
            ),
        ]

    def __str__(self):
        tramite_str = str(self.id_tramite_servicio) if self.id_tramite_servicio_id else "Sin trámite"
        return f"Ficha #{self.id_ficha} — {tramite_str[:40]} (status: {self.get_status_display()})"
