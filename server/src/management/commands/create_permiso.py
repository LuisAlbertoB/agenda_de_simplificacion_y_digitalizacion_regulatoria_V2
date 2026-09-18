from django.core.management.base import BaseCommand
from src.models import Permiso


class Command(BaseCommand):
    help = "Crea o actualiza un permiso del sistema por su clave."

    def add_arguments(self, parser):
        parser.add_argument('--clave', type=str, required=True, help="Clave única del permiso (ej. AGENDAS_READ)")
        parser.add_argument('--valor', type=int, default=2, choices=[0, 1, 2], help="Nivel del permiso (0=ninguno, 1=lectura, 2=escritura)")

    def handle(self, *args, **options):
        clave = options['clave'].upper()
        valor = options['valor']

        permiso, created = Permiso.objects.update_or_create(
            clave=clave,
            defaults={'valor': valor}
        )

        accion = "creado" if created else "actualizado"
        self.stdout.write(self.style.SUCCESS(f"Permiso '{clave}' (valor={valor}) {accion} exitosamente con ID {permiso.id_permiso}."))
