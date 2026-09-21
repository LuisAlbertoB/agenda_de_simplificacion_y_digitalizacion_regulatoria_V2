from django.core.management.base import BaseCommand
from src.models import Accion, Actividad, Entregable


def make_title_desc(text):
    """Trunca el título si excede 255 caracteres y asigna el texto completo a la descripción."""
    if len(text) > 255:
        return text[:252] + "...", text
    return text, text


class Command(BaseCommand):
    help = 'Siembra el catálogo oficial completo (Acciones, Actividades y Entregables LNETB) de forma idempotente.'

    CATALOGO_LNETB = [
        # 1. AMP_VIGENCIA
        {
            'clave': 'AMP_VIGENCIA',
            'titulo': 'Ampliar la vigencia del trámite o servicio',
            'descripcion': 'Ampliar el periodo de validez de las licencias, permisos o resoluciones emitidas.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado y oficio de envío.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de las mejoras implementadas',
                    'entregables': [
                        'Aviso público circular o comunicado de las mejoras implementadas.',
                        'Captura de pantalla de la actualización en el portal ciudadano único de trámites y servicios.',
                        'Evidencia de la difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Folletos publicitarios.',
                        'Propuesta y justificación de costos o derechos antes y después.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                    ]
                },
            ]
        },
        # 2. RED_PLAZO
        {
            'clave': 'RED_PLAZO',
            'titulo': 'Reducir el plazo de resolución',
            'descripcion': 'Disminuir el tiempo máximo en días de respuesta oficial al ciudadano.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Reingeniería del proceso',
                    'entregables': [
                        'Descripción de actividades del proceso actual y simplificado (identificando las acciones que no agregan valor al proceso, desarrollando alternativas del proceso, que garantice la operatividad del nuevo proceso).',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado y oficio de envío.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de las mejoras implementadas',
                    'entregables': [
                        'Aviso público circular o comunicado de las mejoras implementadas.',
                        'Captura de pantalla de la actualización en el portal ciudadano único de trámites y servicios.',
                        'Evidencia de la difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Folletos publicitarios.',
                        'Propuesta y justificación de costos o derechos antes y después.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                    ]
                },
            ]
        },
        # 3. RED_REQUISITOS
        {
            'clave': 'RED_REQUISITOS',
            'titulo': 'Reducir los requisitos del trámite o servicio',
            'descripcion': 'Disminuir el número total de documentos o condiciones requeridas.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                        'Justificación técnica (nota técnica o informe donde se explique porque se disminuyen el requisito).',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Recepción de la autorización por Acuerdo del Cabildo.',
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                        'Actualización de la ficha del trámite o servicio en el portal ciudadano único de trámites y servicios, y captura de pantalla que muestre la actualización.',
                    ]
                },
            ]
        },
        # 4. ELI_REQUISITOS
        {
            'clave': 'ELI_REQUISITOS',
            'titulo': 'Eliminar requisitos del trámite o servicio',
            'descripcion': 'Eliminar definitivamente requisitos obsoletos o innecesarios.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Justificación técnica (nota técnica o informe donde se explique porque se elimina el (los) requisito(s)).',
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                        'Actualización de la ficha del trámite o servicio en el portal ciudadano único de trámites y servicios, y captura de pantalla que muestre la actualización.',
                    ]
                },
            ]
        },
        # 5. FUS_TRAMITES
        {
            'clave': 'FUS_TRAMITES',
            'titulo': 'Fusionar trámites y/o modalidades',
            'descripcion': 'Integrar dos o más procesos o modalidades en una sola gestión unificada.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Reingeniería del proceso',
                    'entregables': [
                        'Descripción de actividades del proceso actual y simplificado (identificando las acciones que no agregan valor al proceso, desarrollando alternativas del proceso, que garantice la operatividad del nuevo proceso).',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Justificación técnica (nota técnica o informe donde se explique el beneficio de la fusión).',
                        'Inclusión del nuevo trámite en el formato único de la unidad administrativa.',
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                    ]
                },
            ]
        },
        # 6. SUP_COSTOS_BUR
        {
            'clave': 'SUP_COSTOS_BUR',
            'titulo': 'Supresión de obligaciones regulatorias que representen costos burocráticos para las personas',
            'descripcion': 'Eliminación de trámites o trámites redundantes que generen carga administrativa injustificada.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Reingeniería del proceso',
                    'entregables': [
                        'Descripción de actividades del proceso actual y simplificado (identificando las acciones que no agregan valor al proceso, desarrollando alternativas del proceso, que garantice la operatividad del nuevo proceso).',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Justificación técnica (nota técnica o informe donde se explique el beneficio de la supresión).',
                        'Modificación del formato único de trámites.',
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                    ]
                },
            ]
        },
        # 7. CONV_AVISOS
        {
            'clave': 'CONV_AVISOS',
            'titulo': 'Conversión de trámites en avisos o manifestaciones',
            'descripcion': 'Sustituir la resolución previa por la sola presentación de aviso o declaración bajo protesta.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Diagnóstico del trámite o servicio a simplificar, identificando el alcance y los objetivos.',
                    ]
                },
                {
                    'titulo': 'Reingeniería del proceso',
                    'entregables': [
                        'Descripción de actividades del proceso actual y simplificado (identificando las acciones que no agregan valor al proceso, desarrollando alternativas del proceso, que garantice la operatividad del nuevo proceso).',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Justificación técnica (nota técnica o informe donde se explique el beneficio de la conversión).',
                        'Inclusión del nuevo trámite de aviso en el formato único de la unidad administrativa.',
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                        'Actualización de la ficha del trámite o servicio en el portal ciudadano único de trámites y servicios, y captura de pantalla que muestre la actualización.',
                    ]
                },
            ]
        },
        # 8. SIMP_FORMATOS
        {
            'clave': 'SIMP_FORMATOS',
            'titulo': 'Implementar o simplificar formatos',
            'descripcion': 'Crear o estandarizar solicitudes simples y accesibles para las personas.',
            'simplificacion_o_digitalizacion': True,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo y acuerdan la acción para simplificar.',
                        'Propuesta del formato o formatos simplificado.',
                    ]
                },
                {
                    'titulo': 'Elaboración y firma del acuerdo donde se aprueba la acción a simplificar',
                    'entregables': [
                        'Acuerdo firmado.',
                    ]
                },
                {
                    'titulo': 'Puesta en marcha de la acción de simplificación',
                    'entregables': [
                        'Evidencia de la capacitación y difusión del nuevo proceso entre los servidores públicos involucrados.',
                        'Encuestas de satisfacción del usuario del trámite y/o servicio simplificado.',
                        'Publicidad de las mejoras implementadas (folletos, carteles u otros medios de difusión).',
                        'Actualización de la ficha del trámite o servicio en el portal ciudadano único de trámites y servicios, y captura de pantalla que muestre la actualización.',
                    ]
                },
            ]
        },
        # 9. OTRAS_SIMP
        {
            'clave': 'OTRAS_SIMP',
            'titulo': 'Cualquier otra acción que contribuya a la simplificación administrativa, la eficiencia regulatoria o a mejorar la experiencia de las personas usuarias',
            'descripcion': 'Otras medidas generales de simplificación operativa y eficiencia administrativa.',
            'simplificacion_o_digitalizacion': True,
            'actividades': []
        },
        # 10. INC_VENTANILLA
        {
            'clave': 'INC_VENTANILLA',
            'titulo': 'Incorporar el trámite o servicio a la Ventanilla Única Digital',
            'descripcion': 'Permitir la gestión electrónica integral a través del portal de Ventanilla Única Digital.',
            'simplificacion_o_digitalizacion': False,
            'actividades': [
                {
                    'titulo': 'Integración del equipo de trabajo e inicio de las actividades de simplificación',
                    'entregables': [
                        'Minuta que describa la integración del equipo de trabajo en donde se nombre al o los enlaces del sujeto obligado con toma de decisiones y conocimiento amplio del proceso del trámite o servicio y se apruebe la digitalización del trámite o servicio.',
                    ]
                },
                {
                    'titulo': 'Planificación.– identificar los requisitos del proyecto.',
                    'entregables': [
                        'Descripción de actividades, diagrama de flujo y formatos del trámite o servicio a digitalizar.',
                        'Copia del oficio dirigido a las CTIC y CMR donde dan a conocer que la mejora del proceso la están adoptando en la práctica.',
                    ]
                },
                {
                    'titulo': 'Análisis del proyecto (Recopilar y revisar los datos sobre los requisitos, pasos e información general del proyecto)',
                    'entregables': [
                        'Copia del acuerdo interno entre el sujeto obligado, la CMR y la CTIC que plasme las acciones que se realizarán para la digitalización del trámite o servicio y calendario de cumplimiento y nombramiento de los enlaces que validarán los módulos del proyecto.',
                    ]
                },
                {
                    'titulo': 'Desarrollo',
                    'entregables': [
                        'CTIC.',
                    ]
                },
                {
                    'titulo': 'Pruebas (revisar el código, ejecutar, validar y eliminar errores)',
                    'entregables': [
                        'Copia del documento donde el sujeto obligado valida los módulos del proyecto final.',
                        'Evidencia de que el servidor público designado por el sujeto obligado para capacitar al personal involucrado acudió a las capacitaciones del proyecto finalizado y validado.',
                    ]
                },
                {
                    'titulo': 'Despliegue (implementar el código en el entorno de producción)',
                    'entregables': [
                        'Presentación del proyecto final y capacitación.',
                        'Copia de listas de asistencia y fotografías.',
                    ]
                },
                {
                    'titulo': 'Informe de cumplimiento de la Agenda',
                    'entregables': [
                        'Resumen ejecutivo.',
                        'Listado de acciones de digitalización implementadas, junto con la evidencia documental o técnica que accredite su implementación.',
                        'Listado de las acciones que no fueron implementadas, justificando el motivo de su incumplimiento.',
                        'Análisis de resultados frente a los objetivos, metas e indicadores definidos.',
                        'Análisis comparativo de resultados obtenidos frente a los objetivos, metas e indicadores definidos.',
                    ]
                },
            ]
        },
        # 11. OTRAS_DIGI
        {
            'clave': 'OTRAS_DIGI',
            'titulo': 'Implementar otras soluciones tecnológicas que permitan eficientar el trámite o servicio',
            'descripcion': 'Uso de firma electrónica, interoperabilidad, pagos en línea u otras herramientas digitales.',
            'simplificacion_o_digitalizacion': False,
            'actividades': []
        },
    ]

    def handle(self, *args, **options):
        acc_creadas = 0
        acc_existentes = 0
        act_creadas = 0
        act_existentes = 0
        ent_creados = 0
        ent_existentes = 0

        for item_acc in self.CATALOGO_LNETB:
            accion_obj, created_acc = Accion.objects.get_or_create(
                clave=item_acc['clave'],
                defaults={
                    'titulo': item_acc['titulo'],
                    'descripcion': item_acc['descripcion'],
                    'simplificacion_o_digitalizacion': item_acc['simplificacion_o_digitalizacion'],
                }
            )
            if created_acc:
                acc_creadas += 1
            else:
                acc_existentes += 1

            actividades = item_acc.get('actividades', [])
            for idx_act, item_act in enumerate(actividades, start=1):
                act_clave = f"{accion_obj.clave}-ACT{idx_act:02d}"
                act_titulo, act_desc = make_title_desc(item_act['titulo'])

                actividad_obj, created_act = Actividad.objects.get_or_create(
                    id_accion=accion_obj,
                    clave=act_clave,
                    defaults={
                        'titulo': act_titulo,
                        'descripcion': act_desc,
                    }
                )
                if created_act:
                    act_creadas += 1
                else:
                    act_existentes += 1

                entregables = item_act.get('entregables', [])
                for idx_ent, text_ent in enumerate(entregables, start=1):
                    ent_clave = f"{act_clave}-ENT{idx_ent:02d}"
                    ent_titulo, ent_desc = make_title_desc(text_ent)

                    entregable_obj, created_ent = Entregable.objects.get_or_create(
                        id_actividad=actividad_obj,
                        clave=ent_clave,
                        defaults={
                            'titulo': ent_titulo,
                            'descripcion': ent_desc,
                            'status': False,
                        }
                    )
                    if created_ent:
                        ent_creados += 1
                    else:
                        ent_existentes += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Siembra del catálogo LNETB completada:\n"
                f"  - Acciones: {acc_creadas} creadas, {acc_existentes} ya existían (Total: {acc_creadas + acc_existentes}).\n"
                f"  - Actividades: {act_creadas} creadas, {act_existentes} ya existían (Total: {act_creadas + act_existentes}).\n"
                f"  - Entregables: {ent_creados} creados, {ent_existentes} ya existían (Total: {ent_creados + ent_existentes})."
            )
        )
