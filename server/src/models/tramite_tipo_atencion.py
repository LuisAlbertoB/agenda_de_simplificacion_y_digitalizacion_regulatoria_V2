from django.db import models


class TramiteTipoAtencion(models.Model):
    """
    Tabla pivote N:M para las modalidades de atención de un trámite o servicio.
    Tabla: tramites_has_tipos
    """

    TIPO_PRESENCIAL = 0
    TIPO_VIA_TELEFONICA = 1
    TIPO_VIA_DIGITAL = 2
    TIPO_CHOICES = [
        (TIPO_PRESENCIAL,     'Presencial'),
        (TIPO_VIA_TELEFONICA, 'Vía Telefónica'),
        (TIPO_VIA_DIGITAL,    'Vía Digital'),
    ]

    id_tramite_tipo_atencion = models.BigAutoField(
        primary_key=True,
        db_column='id_tramite_tipo_atencion',
        verbose_name="ID"
    )
    id_tramite_servicio = models.ForeignKey(
        'src.TramiteOServicio',
        on_delete=models.CASCADE,
        related_name='tipos_atencion',
        db_column='id_tramite_servicio',
        verbose_name="Trámite o Servicio",
        help_text="Trámite o Servicio asociado (ON DELETE CASCADE)"
    )
    tipo = models.IntegerField(
        choices=TIPO_CHOICES,
        verbose_name="Tipo de atención",
        help_text="0=Presencial, 1=Vía Telefónica, 2=Vía Digital"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")

    class Meta:
        db_table = 'tramites_has_tipos'
        verbose_name = 'Trámite Tipo Atención'
        verbose_name_plural = 'Trámites Tipos Atención'
        ordering = ['id_tramite_servicio', 'tipo']
        constraints = [
            models.UniqueConstraint(
                fields=['id_tramite_servicio', 'tipo'],
                name='unique_tramite_tipo_atencion'
            )
        ]

    def __str__(self):
        return f"Trámite #{self.id_tramite_servicio_id} → {self.get_tipo_display()}"
