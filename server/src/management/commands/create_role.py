from django.core.management.base import BaseCommand
from src.models import Role


class Command(BaseCommand):
    help = "Crea o actualiza un rol del sistema por su clave."

    def add_arguments(self, parser):
        parser.add_argument('--clave', type=str, required=True, help="Clave única del rol (ej. ADMIN)")
        parser.add_argument('--nombre', type=str, required=True, help="Nombre oficial del rol")
        parser.add_argument('--siglas', type=str, default="", help="Siglas del rol")

    def handle(self, *args, **options):
        clave = options['clave'].upper()
        nombre = options['nombre']
        siglas = options['siglas']

        role, created = Role.objects.update_or_create(
            clave=clave,
            defaults={
                'nombre_oficial': nombre,
                'siglas': siglas,
                'status': True,
            }
        )

        accion = "creado" if created else "actualizado"
        self.stdout.write(self.style.SUCCESS(f"Rol '{clave}' ({nombre}) {accion} exitosamente con ID {role.id_role}."))
