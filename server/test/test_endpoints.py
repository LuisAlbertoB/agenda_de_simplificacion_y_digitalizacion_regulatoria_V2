from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from src.models import Role, Permiso, Dependencia, Usuario


class EndpointsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Configurar entidad base para las FKs
        self.role = Role.objects.create(clave='ADMIN', nombre_oficial='Administrador', status=True)
        self.dependencia = Dependencia.objects.create(
            clave='DEP01',
            nombre_oficial='Dependencia 1',
            ambito=1,
            status=True
        )

        # Usuario autenticado
        self.user = Usuario.objects.create_superuser(
            correo_electronico='testadmin@gob.mx',
            password='TestPassword123!',
            nombres='Test',
            apellido1='User',
            id_role=self.role,
            id_dependencia=self.dependencia
        )

        # Login para obtener JWT Token
        res_login = self.client.post('/api/token/', {
            'correo_electronico': 'testadmin@gob.mx',
            'password': 'TestPassword123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.token = res_login.data['access']

    def test_unauthenticated_access_returns_401(self):
        recursos = [
            'roles', 'permisos', 'roles-has-permisos', 'dependencias', 'usuarios',
            'tramites-o-servicios', 'agendas', 'fichas', 'cobros',
            'acciones', 'actividades', 'entregables', 'fichas-has-acciones', 'cronograma'
        ]
        for recurso in recursos:
            response = self.client.get(f'/api/{recurso}/')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Recurso {recurso} debió retornar 401")

    def test_authenticated_access_returns_200(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        recursos = [
            'roles', 'permisos', 'roles-has-permisos', 'dependencias', 'usuarios',
            'tramites-o-servicios', 'agendas', 'fichas', 'cobros',
            'acciones', 'actividades', 'entregables', 'fichas-has-acciones', 'cronograma'
        ]
        for recurso in recursos:
            response = self.client.get(f'/api/{recurso}/')
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Recurso {recurso} debió retornar 200")
