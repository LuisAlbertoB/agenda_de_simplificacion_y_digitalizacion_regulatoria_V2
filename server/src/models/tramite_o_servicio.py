from django.db import models


class TramiteOServicio(models.Model):
    """
    Catálogo de trámites o servicios regulados.
    Tabla: tramites_o_servicios
    """

    # Tipos de trámite/servicio (sin etiquetas en SQL — resolución conservadora)
    TIPO_TRAMITE_PRESENCIAL = 0
    TIPO_TRAMITE_DIGITAL = 1
    TIPO_SERVICIO_PRESENCIAL = 2
    TIPO_SERVICIO_DIGITAL = 3
    TIPO_MIXTO = 4
    TIPO_CHOICES = [
        (TIPO_TRAMITE_PRESENCIAL,  'Trámite presencial'),
        (TIPO_TRAMITE_DIGITAL,     'Trámite digital'),
        (TIPO_SERVICIO_PRESENCIAL, 'Servicio presencial'),
        (TIPO_SERVICIO_DIGITAL,    'Servicio digital'),
        (TIPO_MIXTO,               'Mixto'),
    ]

    id_tramite_servicio = models.BigAutoField(
        primary_key=True,
        db_column='id_tramite_servicio',
        verbose_name="ID de Trámite/Servicio"
    )
    clave = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Clave",
        help_text="Identificador único del trámite o servicio"
    )
    nombre_oficial = models.TextField(
        verbose_name="Nombre oficial",
        help_text="Nombre oficial completo del trámite o servicio"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Descripción general del trámite o servicio"
    )
    objetivo = models.TextField(
        blank=True,
        null=True,
        verbose_name="Objetivo",
        help_text="Objetivo o finalidad del trámite o servicio"
    )
    tipo = models.IntegerField(
        choices=TIPO_CHOICES,
        blank=True,
        null=True,
        verbose_name="Tipo",
        help_text="0=trámite presencial, 1=trámite digital, 2=servicio presencial, 3=servicio digital, 4=mixto"
    )
    tramite_o_servicio = models.BooleanField(
        blank=True,
        null=True,
        verbose_name="¿Es trámite?",
        help_text="True = trámite, False = servicio"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='tramites_servicios_creados',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'tramites_o_servicios'
        verbose_name = 'Trámite o Servicio'
        verbose_name_plural = 'Trámites o Servicios'
        ordering = ['clave']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(tipo__isnull=True) | (models.Q(tipo__gte=0) & models.Q(tipo__lte=4)),
                name='chk_tramites_tipo'
            ),
        ]

    def __str__(self):
        tipo_str = "Trámite" if self.tramite_o_servicio else "Servicio"
        return f"[{tipo_str}] {self.clave} — {self.nombre_oficial[:60]}"
