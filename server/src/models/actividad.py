from django.db import models


class Actividad(models.Model):
    """
    Actividades que componen una acción de simplificación/digitalización.
    Tabla: actividades
    Nota: la PK es id_actividades (plural) — fiel al script.sql.
    """

    id_actividades = models.BigAutoField(
        primary_key=True,
        db_column='id_actividades',
        verbose_name="ID de Actividad"
    )
    id_accion = models.ForeignKey(
        'src.Accion',
        on_delete=models.CASCADE,
        related_name='actividades',
        db_column='id_accion',
        verbose_name="Acción",
        help_text="Acción a la que pertenece esta actividad (ON DELETE CASCADE)"
    )
    clave = models.CharField(
        max_length=50,
        verbose_name="Clave",
        help_text="Clave de la actividad dentro de la acción"
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name="Título",
        help_text="Título descriptivo de la actividad"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Descripción detallada de la actividad"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='actividades_creadas',
        db_column='created_by_id',
        verbose_name="Creada por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'actividades'
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'
        ordering = ['id_accion', 'clave']

    def __str__(self):
        return f"{self.clave} — {self.titulo}"
