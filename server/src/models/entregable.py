from django.db import models


class Entregable(models.Model):
    """
    Entregables de una actividad.
    Tabla: entregables
    """

    id_entregable = models.BigAutoField(
        primary_key=True,
        db_column='id_entregable',
        verbose_name="ID de Entregable"
    )
    id_actividad = models.ForeignKey(
        'src.Actividad',
        on_delete=models.CASCADE,
        related_name='entregables',
        db_column='id_actividad',
        verbose_name="Actividad",
        help_text="Actividad a la que pertenece este entregable (ON DELETE CASCADE)"
    )
    clave = models.CharField(
        max_length=50,
        verbose_name="Clave",
        help_text="Clave del entregable dentro de la actividad"
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name="Título",
        help_text="Título descriptivo del entregable"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Descripción detallada del entregable"
    )
    status = models.BooleanField(
        default=False,
        verbose_name="Completado",
        help_text="False = pendiente, True = entregable completado"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='entregables_creados',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'entregables'
        verbose_name = 'Entregable'
        verbose_name_plural = 'Entregables'
        ordering = ['id_actividad', 'clave']

    def __str__(self):
        status_str = "✅" if self.status else "⏳"
        return f"{status_str} {self.clave} — {self.titulo}"
