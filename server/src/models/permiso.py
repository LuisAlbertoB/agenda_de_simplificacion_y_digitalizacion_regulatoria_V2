from django.db import models


class Permiso(models.Model):
    """
    Catálogo de permisos del sistema.
    Tabla: permisos
    """

    # Niveles de valor de permiso (comentario en script.sql)
    VALOR_SIN_PERMISOS = 0
    VALOR_SOLO_LECTURA = 1
    VALOR_LECTURA_Y_ESCRITURA = 2
    VALOR_CHOICES = [
        (VALOR_SIN_PERMISOS,       'Sin permisos'),
        (VALOR_SOLO_LECTURA,       'Solo lectura'),
        (VALOR_LECTURA_Y_ESCRITURA, 'Lectura y escritura'),
    ]

    # Nivel máximo que define acceso root (usado en middlewares/permissions.py)
    NIVEL_ROOT = VALOR_LECTURA_Y_ESCRITURA

    id_permiso = models.BigAutoField(
        primary_key=True,
        db_column='id_permiso',
        verbose_name="ID de Permiso"
    )
    clave = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Clave",
        help_text="Identificador único del permiso (ej: admin_total, lectura_fichas)"
    )
    valor = models.IntegerField(
        choices=VALOR_CHOICES,
        default=VALOR_SIN_PERMISOS,
        verbose_name="Valor",
        help_text="0 = sin permisos, 1 = solo lectura, 2 = lectura y escritura"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='permisos_creados',
        db_column='created_by_id',
        verbose_name="Creado por",
        help_text="Usuario que registró este permiso"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'permisos'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['clave']

    def __str__(self):
        return f"{self.clave} (valor: {self.get_valor_display()})"
