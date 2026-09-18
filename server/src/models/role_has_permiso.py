from django.db import models


class RoleHasPermiso(models.Model):
    """
    Tabla pivote N:M entre roles y permisos.
    Tabla: roles_has_permisos
    """

    id_role_has_permiso = models.BigAutoField(
        primary_key=True,
        db_column='id_role_has_permiso',
        verbose_name="ID"
    )
    id_role = models.ForeignKey(
        'src.Role',
        on_delete=models.CASCADE,
        related_name='roles_has_permisos',
        db_column='id_role',
        verbose_name="Rol",
        help_text="Rol al que se asigna el permiso"
    )
    id_permiso = models.ForeignKey(
        'src.Permiso',
        on_delete=models.CASCADE,
        related_name='roles_has_permisos',
        db_column='id_permiso',
        verbose_name="Permiso",
        help_text="Permiso asignado al rol"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='roles_has_permisos_creados',
        db_column='created_by_id',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'roles_has_permisos'
        verbose_name = 'Rol tiene Permiso'
        verbose_name_plural = 'Roles tienen Permisos'
        ordering = ['id_role', 'id_permiso']

    def __str__(self):
        return f"{self.id_role.clave} → {self.id_permiso.clave}"
