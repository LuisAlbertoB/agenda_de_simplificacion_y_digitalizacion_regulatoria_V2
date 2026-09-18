from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario."""

    def create_user(self, correo_electronico, nombres, apellido1, password=None, **extra_fields):
        """Crea y retorna un usuario normal."""
        if not correo_electronico:
            raise ValueError('El campo "correo_electronico" es obligatorio.')
        if not nombres:
            raise ValueError('El campo "nombres" es obligatorio.')
        if not apellido1:
            raise ValueError('El campo "apellido1" es obligatorio.')

        correo_electronico = self.normalize_email(correo_electronico)
        user = self.model(
            correo_electronico=correo_electronico,
            nombres=nombres,
            apellido1=apellido1,
            **extra_fields
        )
        if password:
            user.set_password(password)      # Hashea con Bcrypt (settings.PASSWORD_HASHERS)
        else:
            user.set_unusable_password()      # Marca la contraseña como no establecida
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_electronico, nombres, apellido1, password=None, **extra_fields):
        """Crea y retorna un superusuario Django (para manage.py createsuperuser)."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(correo_electronico, nombres, apellido1, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario del sistema. Reemplaza al User genérico de Django.
    Tabla: usuarios

    Campos adicionales respecto al script.sql (requeridos por Django/AbstractBaseUser):
      - is_active: requerido por AbstractBaseUser para login
      - is_staff: requerido para acceso al admin de Django
      - last_login: gestionado por AbstractBaseUser automáticamente
      - is_superuser, groups, user_permissions: heredados de PermissionsMixin
    """

    id_usuario = models.BigAutoField(
        primary_key=True,
        db_column='id_usuario',
        verbose_name="ID de Usuario"
    )
    curp = models.CharField(
        max_length=18,
        unique=True,
        blank=True,
        null=True,
        verbose_name="CURP",
        help_text="Clave Única de Registro de Población (18 caracteres)"
    )
    llave_mx = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Llave MX",
        help_text="Identificador logístico para futura integración con Llave MX"
    )
    # Nota: el campo 'password' lo gestiona AbstractBaseUser automáticamente.
    # Mapea al campo password VARCHAR(255) del SQL con el mismo propósito (bcrypt).
    correo_electronico = models.EmailField(
        max_length=255,
        unique=True,
        verbose_name="Correo electrónico",
        help_text="Dirección de correo electrónico, usada como nombre de usuario para login"
    )
    nombres = models.CharField(
        max_length=255,
        verbose_name="Nombres",
        help_text="Nombre(s) del usuario"
    )
    apellido1 = models.CharField(
        max_length=255,
        verbose_name="Primer apellido",
        help_text="Primer apellido del usuario"
    )
    apellido2 = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Segundo apellido",
        help_text="Segundo apellido del usuario (opcional)"
    )
    cargo_oficial = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Cargo oficial",
        help_text="Cargo o puesto oficial del usuario dentro de la dependencia"
    )
    is_oficial_link_person = models.BooleanField(
        default=False,
        verbose_name="Es persona enlace oficial",
        help_text="True = usuario designado como enlace oficial de su dependencia"
    )

    # TODO(decisión pendiente): El SQL define id_dependencia NOT NULL, pero para crear el
    # superusuario inicial (antes de que existan dependencias) se necesita null=True.
    # En el serializer de la API este campo es obligatorio para usuarios normales.
    id_dependencia = models.ForeignKey(
        'src.Dependencia',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='usuarios',
        db_column='id_dependencia',
        verbose_name="Dependencia",
        help_text="Dependencia gubernamental a la que pertenece el usuario"
    )

    # TODO(decisión pendiente): El SQL define id_role NOT NULL, pero para el superusuario
    # inicial se necesita null=True. En el API serializer es obligatorio para usuarios normales.
    id_role = models.ForeignKey(
        'src.Role',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='usuarios',
        db_column='id_role',
        verbose_name="Rol",
        help_text="Rol asignado al usuario que determina sus permisos en el RBAC"
    )
    status = models.BooleanField(
        default=True,
        verbose_name="Activo en sistema",
        help_text="True = usuario habilitado, False = usuario deshabilitado"
    )
    created_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='usuarios_creados',
        db_column='created_by_id',
        verbose_name="Creado por",
        help_text="Usuario que registró este usuario"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de registro")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    # Campos requeridos por Django para el admin y permisos (no están en el SQL original)
    is_active = models.BooleanField(default=True, verbose_name="Activo en Django")
    is_staff = models.BooleanField(default=False, verbose_name="Es staff (acceso al admin)")

    objects = UsuarioManager()

    # Configuración de autenticación
    USERNAME_FIELD = 'correo_electronico'   # Campo usado para login
    REQUIRED_FIELDS = ['nombres', 'apellido1']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        nombre_completo = f"{self.nombres} {self.apellido1}"
        role_str = self.id_role.clave if self.id_role else "Sin rol"
        return f"{nombre_completo} ({self.correo_electronico}) — {role_str}"

    @property
    def nombre_completo(self):
        """Retorna el nombre completo del usuario."""
        partes = [self.nombres, self.apellido1]
        if self.apellido2:
            partes.append(self.apellido2)
        return ' '.join(partes)
