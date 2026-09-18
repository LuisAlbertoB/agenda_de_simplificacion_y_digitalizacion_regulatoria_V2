import os
from django.core.management.base import BaseCommand
from src.models import Usuario, Role, Dependencia


class Command(BaseCommand):
    help = "Crea un superusuario inicial para el sistema."

    def add_arguments(self, parser):
        parser.add_argument('--correo', type=str, default='admin@gob.mx', help="Correo electrónico del superusuario")
        parser.add_argument('--password', type=str, default='Admin123456!', help="Contraseña")
        parser.add_argument('--nombres', type=str, default='Administrador', help="Nombres")
        parser.add_argument('--apellido1', type=str, default='Sistema', help="Primer apellido")

    def handle(self, *args, **options):
        correo = options['correo']
        password = options['password']

        if Usuario.objects.filter(correo_electronico=correo).exists():
            self.stdout.write(self.style.WARNING(f"El usuario con correo {correo} ya existe."))
            return

        role_admin = Role.objects.filter(clave='ADMIN').first()
        dep_admin = Dependencia.objects.filter(clave='DIGITALIZACION').first()

        user = Usuario.objects.create_superuser(
            correo_electronico=correo,
            password=password,
            nombres=options['nombres'],
            apellido1=options['apellido1'],
            id_role=role_admin,
            id_dependencia=dep_admin,
        )

        self.stdout.write(self.style.SUCCESS(f"Superusuario '{user.correo_electronico}' (ID: {user.id_usuario}) creado exitosamente."))
