from django.db import models


class Agenda(models.Model):
    """
    Agenda semestral/anual de simplificación por dependencia.
    Tabla: agendas
    """

    # Status de la agenda (SQL: status INT DEFAULT 0 CHECK (status >= 0))
    STATUS_BORRADOR = 0
    STATUS_ENVIADA = 1
    STATUS_APROBADA = 2
    STATUS_OBSERVADA = 3
    STATUS_RECHAZADA = 4
    STATUS_CHOICES = [
        (STATUS_BORRADOR,  'Borrador'),
        (STATUS_ENVIADA,   'Enviada'),
        (STATUS_APROBADA,  'Aprobada'),
        (STATUS_OBSERVADA, 'Observada'),
        (STATUS_RECHAZADA, 'Rechazada'),
    ]

    id_agenda = models.BigAutoField(
        primary_key=True,
        db_column='id_agenda',
        verbose_name="ID de Agenda"
    )
    id_dependencia = models.ForeignKey(
        'src.Dependencia',
        on_delete=models.PROTECT,
        related_name='agendas',
        db_column='id_dependencia',
        verbose_name="Dependencia",
        help_text="Dependencia propietaria de esta agenda"
    )
    anio = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Año",
        help_text="Año de la agenda (mínimo 2020)"
    )
    semestre = models.BooleanField(
        blank=True,
        null=True,
        verbose_name="Semestre",
        help_text="True = primer semestre (ene–jun), False = segundo semestre (jul–dic)"
    )
    unidad_administrativa = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Unidad administrativa",
        help_text="Nombre de la unidad administrativa responsable"
    )
    titular_unidad_admin = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Titular de la unidad administrativa",
        help_text="Nombre del titular de la unidad administrativa"
    )
    enlace_oficial = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='agendas_como_enlace',
        db_column='enlace_oficial_id',
        verbose_name="Enlace oficial",
        help_text="Usuario designado como enlace oficial de esta agenda"
    )
    elaboro_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre de quien elaboró"
    )
    elaboro_puesto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Puesto de quien elaboró"
    )
    reviso1_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre de quien revisó (1)"
    )
    reviso1_puesto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Puesto de quien revisó (1)"
    )
    reviso2_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre de quien revisó (2)"
    )
    reviso2_puesto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Puesto de quien revisó (2)"
    )
    autorizo_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre de quien autorizó"
    )
    autorizo_puesto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Puesto de quien autorizó"
    )
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        default=STATUS_BORRADOR,
        verbose_name="Estado",
        help_text="0=borrador, 1=enviada, 2=aprobada, 3=observada, 4=rechazada"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='agendas_creadas',
        db_column='created_by_id',
        verbose_name="Creada por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'agendas'
        verbose_name = 'Agenda'
        verbose_name_plural = 'Agendas'
        ordering = ['-anio', 'id_dependencia']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(anio__isnull=True) | models.Q(anio__gte=2020),
                name='chk_agendas_anio'
            ),
            models.CheckConstraint(
                condition=models.Q(status__gte=0),
                name='chk_agendas_status'
            ),
        ]

    def __str__(self):
        semestre_str = "1er sem." if self.semestre else "2do sem."
        return f"Agenda {self.anio} {semestre_str} — {self.id_dependencia.clave if self.id_dependencia_id else 'Sin dependencia'}"
