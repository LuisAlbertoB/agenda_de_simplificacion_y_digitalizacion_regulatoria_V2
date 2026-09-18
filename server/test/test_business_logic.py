from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from src.models import Role, Dependencia, Usuario, TramiteOServicio, Agenda, Ficha, CronogramaActividad
from src.services import FichaService


class BusinessLogicTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Configurar entidades base
        self.role_admin = Role.objects.create(clave='ADMIN', nombre_oficial='Administrador System', status=True)
        self.dependencia = Dependencia.objects.create(
            clave='DEP_TEST',
            nombre_oficial='Secretaría de Desarrollo Test',
            ambito=1,
            status=True
        )

        self.user = Usuario.objects.create_superuser(
            correo_electronico='admin_logic@gob.mx',
            password='TestPassword123!',
            nombres='Admin',
            apellido1='Logic',
            id_role=self.role_admin,
            id_dependencia=self.dependencia
        )

        # Token JWT
        res_login = self.client.post('/api/token/', {
            'correo_electronico': 'admin_logic@gob.mx',
            'password': 'TestPassword123!'
        })
        self.token = res_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        # Tramite base
        self.tramite = TramiteOServicio.objects.create(
            clave='TR-001',
            nombre_oficial='Trámite de Prueba',
            tipo=0,
            tramite_o_servicio=True
        )

    def test_agenda_unicidad_por_dependencia_anio_semestre(self):
        """Verifica que no se puedan duplicar agendas para la misma dependencia, año y semestre."""
        Agenda.objects.create(
            id_dependencia=self.dependencia,
            anio=2026,
            semestre=True,
            unidad_administrativa='Dirección Test',
            created_by=self.user
        )

        # Intentar crear duplicado por API
        res = self.client.post('/api/agendas/', {
            'id_dependencia_id': self.dependencia.id_dependencia,
            'anio': 2026,
            'semestre': True,
            'unidad_administrativa': 'Dirección Duplicada'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Ya existe una agenda registrada para esta dependencia", str(res.data))

    def test_ficha_unicidad_por_agenda_y_tramite(self):
        """Verifica que no se pueda registrar el mismo trámite dos veces en la misma agenda."""
        agenda = Agenda.objects.create(
            id_dependencia=self.dependencia,
            anio=2026,
            semestre=True,
            created_by=self.user
        )

        Ficha.objects.create(
            id_agenda=agenda,
            id_tramite_servicio=self.tramite,
            created_by=self.user
        )

        # Intentar crear segunda ficha en la misma agenda con el mismo trámite
        res = self.client.post('/api/fichas/', {
            'id_agenda_id': agenda.id_agenda,
            'id_tramite_servicio_id': self.tramite.id_tramite_servicio,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Este trámite ya está registrado en la agenda especificada", str(res.data))

    def test_ficha_coherencia_resoluciones_positivas(self):
        """Verifica que las resoluciones positivas no superen las solicitudes recibidas."""
        agenda = Agenda.objects.create(
            id_dependencia=self.dependencia,
            anio=2026,
            semestre=False,
            created_by=self.user
        )

        res = self.client.post('/api/fichas/', {
            'id_agenda_id': agenda.id_agenda,
            'id_tramite_servicio_id': self.tramite.id_tramite_servicio,
            'solicitudes_recibidas_semestre_anterior': 50,
            'resoluciones_positivas': 100  # Incoherente: 100 > 50
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resoluciones_positivas", res.data)

    def test_cronograma_coherencia_meses(self):
        """Verifica que num_mes_final_plazo no sea menor a num_mes_inicio_plazo."""
        agenda = Agenda.objects.create(id_dependencia=self.dependencia, anio=2026, semestre=True, created_by=self.user)
        ficha = Ficha.objects.create(id_agenda=agenda, id_tramite_servicio=self.tramite, created_by=self.user)

        from src.models import Accion
        accion = Accion.objects.create(clave='ACC_TEST', titulo='Acción Test', simplificacion_o_digitalizacion=True)

        res = self.client.post('/api/cronograma/', {
            'id_ficha_id': ficha.id_ficha,
            'id_accion_id': accion.id_accion,
            'num_mes_inicio_plazo': 4,
            'num_mes_final_plazo': 2  # Incoherente: fin (2) < inicio (4)
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("num_mes_final_plazo", res.data)

    def test_transicion_estado_agenda_invalido(self):
        """Verifica la validación del endpoint /cambiar-estado/ al enviar un entero o valor inválido."""
        agenda = Agenda.objects.create(id_dependencia=self.dependencia, anio=2026, semestre=True, created_by=self.user)

        res = self.client.patch(f'/api/agendas/{agenda.id_agenda}/cambiar-estado/', {
            'status': 99  # Estado inexistente
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Estado inválido", res.data['detail'])

        # Probar transición válida a 'Enviada' (1)
        res_ok = self.client.patch(f'/api/agendas/{agenda.id_agenda}/cambiar-estado/', {
            'status': 1
        })
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        agenda.refresh_from_db()
        self.assertEqual(agenda.status, 1)

    def test_ficha_service_calcular_puntaje_priorizacion(self):
        """Verifica el cálculo del servicio FichaService.calcular_puntaje_priorizacion."""
        agenda = Agenda.objects.create(id_dependencia=self.dependencia, anio=2026, semestre=True, created_by=self.user)
        ficha = Ficha.objects.create(
            id_agenda=agenda,
            id_tramite_servicio=self.tramite,
            plazo_maximo_resolucion_dias=20,  # >15 dias = 15 pts
            poblacion_prioritaria_atencion_preferente=True,  # = 20 pts
            solicitudes_recibidas_semestre_anterior=600,  # >500 = 15 pts
            regulacion_fundamenta_existencia_tramite='Reglamento Municipal Art 12',  # = 20 pts
            fundamento_en_ley_de_ingresos='Ley de Ingresos Art 45',  # = 20 pts
            created_by=self.user
        )

        resultado = FichaService.calcular_puntaje_priorizacion(ficha)
        # Total esperado: 15 + 20 + 15 + 20 + 20 = 90 pts
        self.assertEqual(resultado['puntaje_total'], 90)
        self.assertIn('factores_no_evaluados', resultado)
        self.assertEqual(len(resultado['factores_no_evaluados']), 4)

        # Verificar endpoint HTTP GET /api/fichas/{id}/priorizacion/
        res_api = self.client.get(f'/api/fichas/{ficha.id_ficha}/priorizacion/')
        self.assertEqual(res_api.status_code, status.HTTP_200_OK)
        self.assertEqual(res_api.data['puntaje_total'], 90)

    def test_protected_error_handler_friendly_response(self):
        """Verifica que el intento de borrar una entidad protegida retorne 400 Bad Request amigable."""
        Agenda.objects.create(id_dependencia=self.dependencia, anio=2026, semestre=True, created_by=self.user)

        # Intentar borrar la dependencia que tiene agendas asociadas (on_delete=PROTECT)
        res = self.client.delete(f'/api/dependencias/{self.dependencia.id_dependencia}/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No se puede eliminar este registro porque ya está vinculado a", res.data['detail'])
