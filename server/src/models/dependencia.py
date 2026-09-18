from django.db import models


class Dependencia(models.Model):
    """
    Catálogo de dependencias/entidades gubernamentales.
    Tabla: dependencias
    """

    # Valores de ámbito (comentario en script.sql)
    AMBITO_TODOS = 0
    AMBITO_ESTATAL = 1
    AMBITO_MUNICIPAL = 2
    AMBITO_AUTONOMO = 3
    AMBITO_NINGUNO = 4
    AMBITO_CHOICES = [
        (AMBITO_TODOS,     'Todos'),
        (AMBITO_ESTATAL,   'Estatal'),
        (AMBITO_MUNICIPAL, 'Municipal'),
        (AMBITO_AUTONOMO,  'Autónomo'),
        (AMBITO_NINGUNO,   'Ninguno'),
    ]

    id_dependencia = models.BigAutoField(
        primary_key=True,
        db_column='id_dependencia',
        verbose_name="ID de Dependencia"
    )
    clave = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Clave",
        help_text="Identificador único de la dependencia"
    )
    nombre_oficial = models.CharField(
        max_length=255,
        verbose_name="Nombre oficial",
        help_text="Nombre completo y oficial de la dependencia"
    )
    siglas = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Siglas",
        help_text="Siglas de la dependencia (ej: SEMADES, SEDECO)"
    )
    titular_dependencia = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Titular de la dependencia",
        help_text="Nombre del titular actual de la dependencia"
    )
    ambito = models.IntegerField(
        choices=AMBITO_CHOICES,
        blank=True,
        null=True,
        verbose_name="Ámbito",
        help_text="0: todos, 1: estatal, 2: municipal, 3: autónomo, 4: ninguno"
    )
    status = models.BooleanField(
        default=True,
        verbose_name="Activa",
        help_text="True = dependencia activa, False = inactiva"
    )
    created_by = models.ForeignKey(
        'src.Usuario',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dependencias_creadas',
        db_column='created_by_id',
        verbose_name="Creada por",
        help_text="Usuario que registró esta dependencia"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        db_table = 'dependencias'
        verbose_name = 'Dependencia'
        verbose_name_plural = 'Dependencias'
        ordering = ['nombre_oficial']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ambito__isnull=True) | (models.Q(ambito__gte=0) & models.Q(ambito__lte=4)),
                name='chk_dependencias_ambito'
            ),
        ]

    def __str__(self):
        return f"{self.clave} — {self.nombre_oficial}"
