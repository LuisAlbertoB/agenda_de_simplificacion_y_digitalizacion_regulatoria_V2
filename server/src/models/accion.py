from django.db import models


class Accion(models.Model):
    """
    Acciones de simplificación o digitalización disponibles en el catálogo.
    Tabla: acciones
    """

    id_accion = models.BigAutoField(
        primary_key=True,
        db_column='id_accion',
        verbose_name="ID de Acción"
    )
    simplificacion_o_digitalizacion = models.BooleanField(
        blank=True,
        null=True,
        verbose_name="¿Es simplificación?",
        help_text="True = acción de simplificación, False = acción de digitalización"
    )
    clave = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Clave",
        help_text="Identificador único de la acción (ej. SIM-01, DIG-03)"
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name="Título",
        help_text="Título descriptivo de la acción"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Descripción detallada de la acción"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='acciones_creadas',
        db_column='created_by_id',
        verbose_name="Creada por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'acciones'
        verbose_name = 'Acción'
        verbose_name_plural = 'Acciones'
        ordering = ['clave']

    def __str__(self):
        tipo_str = "Simplificación" if self.simplificacion_o_digitalizacion else "Digitalización"
        return f"[{tipo_str}] {self.clave} — {self.titulo}"
