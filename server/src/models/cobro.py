from django.db import models
from django.core.validators import MinValueValidator


class Cobro(models.Model):
    """
    Conceptos de cobro asociados a una ficha.
    Tabla: cobros
    """

    id_cobros = models.BigAutoField(
        primary_key=True,
        db_column='id_cobros',
        verbose_name="ID de Cobro"
    )
    id_ficha = models.ForeignKey(
        'src.Ficha',
        on_delete=models.CASCADE,
        related_name='cobros',
        db_column='id_ficha',
        verbose_name="Ficha",
        help_text="Ficha a la que pertenece este concepto de cobro (ON DELETE CASCADE)"
    )
    concepto = models.CharField(
        max_length=255,
        verbose_name="Concepto",
        help_text="Descripción del concepto de cobro"
    )
    unidad_medida = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Unidad de medida",
        help_text="Unidad de medida del cobro (ej. UMA, MXN)"
    )
    importe = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0.0)],
        verbose_name="Importe",
        help_text="Monto del cobro (debe ser >= 0)"
    )
    forma_pago = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Forma de pago",
        help_text="Descripción de la forma de pago aceptada"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cobros_creados',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'cobros'
        verbose_name = 'Cobro'
        verbose_name_plural = 'Cobros'
        ordering = ['id_ficha', 'concepto']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(importe__isnull=True) | models.Q(importe__gte=0),
                name='chk_cobros_importe'
            ),
        ]

    def __str__(self):
        return f"Cobro: {self.concepto} — {self.importe} {self.unidad_medida or ''}"
