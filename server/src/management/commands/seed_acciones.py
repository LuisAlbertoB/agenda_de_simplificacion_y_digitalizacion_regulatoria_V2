from django.core.management.base import BaseCommand
from src.models import Accion


class Command(BaseCommand):
    help = 'Siembra el catálogo oficial de las 11 Acciones LNETB en la tabla acciones.'

    ACCIONES_LNETB = [
        {
            'clave': 'AMP_VIGENCIA',
            'titulo': 'Ampliar la vigencia del trámite o servicio',
            'descripcion': 'Ampliar el periodo de validez de las licencias, permisos o resoluciones emitidas.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'RED_PLAZO',
            'titulo': 'Reducir el plazo de resolución',
            'descripcion': 'Disminuir el tiempo máximo en días de respuesta oficial al ciudadano.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'RED_REQUISITOS',
            'titulo': 'Reducir los requisitos del trámite o servicio',
            'descripcion': 'Disminuir el número total de documentos o condiciones requeridas.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'ELI_REQUISITOS',
            'titulo': 'Eliminar requisitos del trámite o servicio',
            'descripcion': 'Eliminar definitivamente requisitos obsoletos o innecesarios.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'FUS_TRAMITES',
            'titulo': 'Fusionar trámites y/o modalidades',
            'descripcion': 'Integrar dos o más procesos o modalidades en una sola gestión unificada.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'SUP_COSTOS_BUR',
            'titulo': 'Supresión de obligaciones regulatorias que representen costos burocráticos para las personas',
            'descripcion': 'Eliminación de trámites o trámites redundantes que generen carga administrativa injustificada.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'CONV_AVISOS',
            'titulo': 'Conversión de trámites en avisos o manifestaciones',
            'descripcion': 'Sustituir la resolución previa por la sola presentación de aviso o declaración bajo protesta.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'SIMP_FORMATOS',
            'titulo': 'Implementar o simplificar formatos',
            'descripcion': 'Crear o estandarizar solicitudes simples y accesibles para las personas.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'OTRAS_SIMP',
            'titulo': 'Otras acciones que contribuyan a la simplificación administrativa, la eficiencia regulatoria o a mejorar la experiencia',
            'descripcion': 'Otras medidas generales de simplificación operativa y eficiencia administrativa.',
            'simplificacion_o_digitalizacion': True,
        },
        {
            'clave': 'INC_VENTANILLA',
            'titulo': 'Incorporar el trámite o servicio a la Ventanilla Única Digital',
            'descripcion': 'Permitir la gestión electrónica integral a través del portal de Ventanilla Única Digital.',
            'simplificacion_o_digitalizacion': False,
        },
        {
            'clave': 'OTRAS_DIGI',
            'titulo': 'Implementar otras soluciones tecnológicas que permitan eficientar el trámite o servicio',
            'descripcion': 'Uso de firma electrónica, interoperabilidad, pagos en línea u otras herramientas digitales.',
            'simplificacion_o_digitalizacion': False,
        },
    ]

    def handle(self, *args, **options):
        creadas = 0
        existentes = 0

        for item in self.ACCIONES_LNETB:
            obj, created = Accion.objects.get_or_create(
                clave=item['clave'],
                defaults={
                    'titulo': item['titulo'],
                    'descripcion': item['descripcion'],
                    'simplificacion_o_digitalizacion': item['simplificacion_o_digitalizacion'],
                }
            )
            if created:
                creadas += 1
            else:
                existentes += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Siembra de Acciones LNETB completada: {creadas} creadas, {existentes} ya existían. Total: {creadas + existentes}."
            )
        )
