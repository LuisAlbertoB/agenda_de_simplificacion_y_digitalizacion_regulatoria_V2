from django.db import models


class FichaHasAccion(models.Model):
    """
    Tabla pivote N:M entre fichas y acciones.
    Tabla: fichas_has_acciones
    """

    id_fichas_has_accion = models.BigAutoField(
        primary_key=True,
        db_column='id_fichas_has_accion',
        verbose_name="ID"
    )
    id_ficha = models.ForeignKey(
        'src.Ficha',
        on_delete=models.CASCADE,
        related_name='fichas_has_acciones',
        db_column='id_ficha',
        verbose_name="Ficha",
        help_text="Ficha a la que se asocia la acción (ON DELETE CASCADE)"
    )
    id_accion = models.ForeignKey(
        'src.Accion',
        on_delete=models.CASCADE,
        related_name='fichas_has_acciones',
        db_column='id_accion',
        verbose_name="Acción",
        help_text="Acción asociada a la ficha (ON DELETE CASCADE)"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fichas_has_acciones_creadas',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'fichas_has_acciones'
        verbose_name = 'Ficha tiene Acción'
        verbose_name_plural = 'Fichas tienen Acciones'
        ordering = ['id_ficha', 'id_accion']

    def __str__(self):
        return f"Ficha #{self.id_ficha_id} → Acción {self.id_accion.clave if self.id_accion_id else '?'}"
