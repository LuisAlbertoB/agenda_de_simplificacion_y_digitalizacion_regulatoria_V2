from django.db import models


class CronogramaActividad(models.Model):
    """
    Calendarización (mes inicio/fin) de una acción dentro de una ficha.
    Tabla: cronograma_de_actividades_por_ficha

    Los meses van de 0 a 6 donde:
      0 = no aplica / no definido
      1 = primer mes del semestre, ..., 6 = sexto mes del semestre
    """

    # Meses del semestre (SQL CHECK 0..6)
    MES_NO_APLICA = 0
    MES_UNO = 1
    MES_DOS = 2
    MES_TRES = 3
    MES_CUATRO = 4
    MES_CINCO = 5
    MES_SEIS = 6
    MES_CHOICES = [
        (MES_NO_APLICA, 'No aplica'),
        (MES_UNO,       'Mes 1'),
        (MES_DOS,       'Mes 2'),
        (MES_TRES,      'Mes 3'),
        (MES_CUATRO,    'Mes 4'),
        (MES_CINCO,     'Mes 5'),
        (MES_SEIS,      'Mes 6'),
    ]

    id_cronograma = models.BigAutoField(
        primary_key=True,
        db_column='id_cronograma',
        verbose_name="ID de Cronograma"
    )
    id_ficha = models.ForeignKey(
        'src.Ficha',
        on_delete=models.CASCADE,
        related_name='cronograma_actividades',
        db_column='id_ficha',
        verbose_name="Ficha",
        help_text="Ficha a la que pertenece este cronograma (ON DELETE CASCADE)"
    )
    id_accion = models.ForeignKey(
        'src.Accion',
        on_delete=models.CASCADE,
        related_name='cronograma_actividades',
        db_column='id_accion',
        verbose_name="Acción",
        help_text="Acción calendarizada (ON DELETE CASCADE)"
    )
    num_mes_inicio_plazo = models.IntegerField(
        choices=MES_CHOICES,
        blank=True,
        null=True,
        verbose_name="Mes de inicio",
        help_text="Mes del semestre en que inicia la acción (0=no aplica, 1-6=mes del semestre)"
    )
    num_mes_final_plazo = models.IntegerField(
        choices=MES_CHOICES,
        blank=True,
        null=True,
        verbose_name="Mes de fin",
        help_text="Mes del semestre en que termina la acción (0=no aplica, 1-6=mes del semestre)"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cronogramas_creados',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'cronograma_de_actividades_por_ficha'
        verbose_name = 'Cronograma de Actividad'
        verbose_name_plural = 'Cronogramas de Actividades'
        ordering = ['id_ficha', 'id_accion', 'num_mes_inicio_plazo']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(num_mes_inicio_plazo__isnull=True) | (models.Q(num_mes_inicio_plazo__gte=0) & models.Q(num_mes_inicio_plazo__lte=6)),
                name='chk_cronograma_mes_inicio'
            ),
            models.CheckConstraint(
                condition=models.Q(num_mes_final_plazo__isnull=True) | (models.Q(num_mes_final_plazo__gte=0) & models.Q(num_mes_final_plazo__lte=6)),
                name='chk_cronograma_mes_final'
            ),
        ]

    def __str__(self):
        return (
            f"Cronograma Ficha #{self.id_ficha_id} — "
            f"Acción {self.id_accion.clave if self.id_accion_id else '?'} "
            f"(meses {self.num_mes_inicio_plazo}–{self.num_mes_final_plazo})"
        )
