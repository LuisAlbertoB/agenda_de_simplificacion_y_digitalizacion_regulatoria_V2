from django.core.management.base import BaseCommand
from src.models import Role, Permiso, RoleHasPermiso, Dependencia, Usuario


class Command(BaseCommand):
    help = "Siembra el catálogo inicial de RBAC: roles, permisos, dependencia raíz y usuario admin inicial."

    def handle(self, *args, **options):
        self.stdout.write("Sembrando datos iniciales RBAC...")

        # 1. Crear Dependencia Administradora Raíz
        dep_admin, _ = Dependencia.objects.get_or_create(
            clave='DIGITALIZACION',
            defaults={
                'nombre_oficial': 'Agencia de Simplificación y Digitalización Regulatoria',
                'siglas': 'ASDR',
                'titular_dependencia': 'Titular General',
                'ambito': Dependencia.AMBITO_ESTATAL,
                'status': True,
            }
        )
        self.stdout.write(f"Dependencia base: {dep_admin.nombre_oficial}")

        # 2. Roles del sistema
        roles_data = [
            ('ADMIN', 'Administrador General', 'ADM'),
            ('ENLACE', 'Enlace Oficial de Dependencia', 'ENL'),
            ('CONSULTA', 'Usuario de Consulta Pública', 'CON'),
        ]
        roles_map = {}
        for clave, nombre, siglas in roles_data:
            role, _ = Role.objects.get_or_create(
                clave=clave,
                defaults={'nombre_oficial': nombre, 'siglas': siglas, 'status': True}
            )
            roles_map[clave] = role
            self.stdout.write(f"Rol preparado: {role.clave}")

        # 3. Permisos base
        permisos_data = [
            ('ADMIN_TOTAL', 2),
            ('AGENDAS_WRITE', 2),
            ('AGENDAS_READ', 1),
            ('FICHAS_WRITE', 2),
            ('FICHAS_READ', 1),
        ]
        permisos_map = {}
        for clave, valor in permisos_data:
            permiso, _ = Permiso.objects.get_or_create(
                clave=clave,
                defaults={'valor': valor}
            )
            permisos_map[clave] = permiso

        # Asignar permisos al rol ADMIN
        for permiso in permisos_map.values():
            RoleHasPermiso.objects.get_or_create(
                id_role=roles_map['ADMIN'],
                id_permiso=permiso
            )

        # 4. Usuario superadmin inicial
        admin_email = 'admin@gob.mx'
        if not Usuario.objects.filter(correo_electronico=admin_email).exists():
            admin_user = Usuario.objects.create_superuser(
                correo_electronico=admin_email,
                password='Admin123456!',
                nombres='Admin',
                apellido1='Principal',
                id_role=roles_map['ADMIN'],
                id_dependencia=dep_admin,
            )
            self.stdout.write(self.style.SUCCESS(f"Superusuario inicial creado: {admin_user.correo_electronico} (pass: Admin123456!)"))
        else:
            self.stdout.write(f"Usuario {admin_email} ya existente.")

        self.stdout.write(self.style.SUCCESS("Sembrado RBAC completado con éxito."))
