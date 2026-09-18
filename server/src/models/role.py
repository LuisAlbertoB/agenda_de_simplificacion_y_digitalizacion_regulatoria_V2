from django.db import models


class Role(models.Model):
    """
    Catálogo de roles del sistema.
    Tabla: roles
    """

    id_role = models.BigAutoField(
        primary_key=True,
        db_column='id_role',
        verbose_name="ID de Rol"
    )
    clave = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Clave",
        help_text="Identificador único del rol (ej: administrador, enlace_dependencia, consulta)"
    )
    nombre_oficial = models.CharField(
        max_length=255,
        verbose_name="Nombre oficial",
        help_text="Nombre descriptivo completo del rol"
    )
    siglas = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Siglas",
        help_text="Siglas opcionales del rol"
    )
    status = models.BooleanField(
        default=True,
        verbose_name="Activo",
        help_text="True = rol activo, False = rol inactivo"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='roles_creados',
        db_column='created_by_id',
        verbose_name="Creado por",
        help_text="Usuario que registró este rol"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['id_role']

    def __str__(self):
        return f"{self.clave} — {self.nombre_oficial}"
