from django.db import models


class FichaNivelDigitalizacion(models.Model):
    """
    Tabla pivote N:M para niveles de madurez digital soportados por una ficha.
    Tabla: fichas_has_niveles_digitalizacion
    """

    NIVEL_0_PRESENCIAL = 0
    NIVEL_1_INFORMATIVO = 1
    NIVEL_2_INTERACTIVO = 2
    NIVEL_3_DIGITAL = 3
    NIVEL_4_AUTOMATIZADO = 4
    NIVEL_CHOICES = [
        (NIVEL_0_PRESENCIAL, 'Nivel 0: Presencial'),
        (NIVEL_1_INFORMATIVO, 'Nivel 1: Informativo'),
        (NIVEL_2_INTERACTIVO, 'Nivel 2: Interactivo parcial'),
        (NIVEL_3_DIGITAL, 'Nivel 3: Digital end-to-end'),
        (NIVEL_4_AUTOMATIZADO, 'Nivel 4: Automatizado'),
    ]

    id_ficha_nivel_digitalizacion = models.BigAutoField(
        primary_key=True,
        db_column='id_ficha_nivel_digitalizacion',
        verbose_name="ID"
    )
    id_ficha = models.ForeignKey(
        'src.Ficha',
        on_delete=models.CASCADE,
        related_name='niveles_digitalizacion',
        db_column='id_ficha',
        verbose_name="Ficha",
        help_text="Ficha asociada (ON DELETE CASCADE)"
    )
    nivel = models.IntegerField(
        choices=NIVEL_CHOICES,
        verbose_name="Nivel de madurez digital",
        help_text="0=Presencial, 1=Informativo, 2=Interactivo parcial, 3=Digital end-to-end, 4=Automatizado"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")

    class Meta:
        db_table = 'fichas_has_niveles_digitalizacion'
        verbose_name = 'Ficha Nivel Digitalización'
        verbose_name_plural = 'Fichas Niveles Digitalización'
        ordering = ['id_ficha', 'nivel']
        constraints = [
            models.UniqueConstraint(fields=['id_ficha', 'nivel'], name='unique_ficha_nivel')
        ]

    def __str__(self):
        return f"Ficha #{self.id_ficha_id} → Nivel {self.nivel}"
