from src.models import Agenda


class AgendaService:
    """Capa de servicio para la entidad Agenda."""

    @staticmethod
    def obtener_todos():
        return Agenda.objects.select_related('id_dependencia', 'enlace_oficial').all()

    @staticmethod
    def obtener_por_id(id_agenda):
        try:
            return Agenda.objects.select_related('id_dependencia', 'enlace_oficial').get(pk=id_agenda)
        except Agenda.DoesNotExist:
            return None

    @staticmethod
    def obtener_consolidado(id_agenda):
        """
        Retorna la agenda consolidada con todas sus fichas, las acciones vinculadas a cada ficha
        y sus actividades calendarizadas en el cronograma.
        """
        agenda = AgendaService.obtener_por_id(id_agenda)
        if not agenda:
            return None

        from src.models import Ficha, FichaHasAccion, CronogramaActividad
        from src.services.ficha_serializer import FichaSerializer
        from src.services.ficha_has_accion_serializer import FichaHasAccionSerializer
        from src.services.cronograma_actividad_serializer import CronogramaActividadSerializer

        fichas_qs = Ficha.objects.filter(id_agenda=agenda).select_related('id_tramite_servicio')
        fichas_data = []

        for ficha in fichas_qs:
            acciones_qs = FichaHasAccion.objects.filter(id_ficha=ficha).select_related('id_accion')
            cronograma_qs = CronogramaActividad.objects.filter(id_ficha=ficha).select_related('id_actividad', 'id_actividad__id_accion')

            f_serializer = FichaSerializer(ficha)
            a_serializer = FichaHasAccionSerializer(acciones_qs, many=True)
            c_serializer = CronogramaActividadSerializer(cronograma_qs, many=True)

            f_dict = f_serializer.data
            f_dict['acciones_vinculadas'] = a_serializer.data
            f_dict['cronograma_actividades'] = c_serializer.data
            fichas_data.append(f_dict)

        from src.services.agenda_serializer import AgendaSerializer
        agenda_dict = AgendaSerializer(agenda).data
        agenda_dict['fichas'] = fichas_data
        agenda_dict['total_fichas'] = len(fichas_data)
        agenda_dict['firmantes'] = {
            "elaboro": {
                "nombre": agenda.elaboro_nombre,
                "puesto": agenda.elaboro_puesto
            },
            "reviso1": {
                "nombre": agenda.reviso1_nombre,
                "puesto": agenda.reviso1_puesto
            },
            "reviso2": {
                "nombre": agenda.reviso2_nombre,
                "puesto": agenda.reviso2_puesto
            },
            "autorizo": {
                "nombre": agenda.autorizo_nombre,
                "puesto": agenda.autorizo_puesto
            }
        }

        return agenda_dict
