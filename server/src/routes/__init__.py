from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.controllers import (
    RoleViewSet,
    PermisoViewSet,
    RoleHasPermisoViewSet,
    DependenciaViewSet,
    UsuarioViewSet,
    TramiteOServicioViewSet,
    AgendaViewSet,
    FichaViewSet,
    CobroViewSet,
    AccionViewSet,
    ActividadViewSet,
    EntregableViewSet,
    FichaHasAccionViewSet,
    CronogramaActividadViewSet,
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permisos', PermisoViewSet, basename='permiso')
router.register(r'roles-has-permisos', RoleHasPermisoViewSet, basename='rolehaspermiso')
router.register(r'dependencias', DependenciaViewSet, basename='dependencia')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'tramites-o-servicios', TramiteOServicioViewSet, basename='tramiteoservicio')
router.register(r'agendas', AgendaViewSet, basename='agenda')
router.register(r'fichas', FichaViewSet, basename='ficha')
router.register(r'cobros', CobroViewSet, basename='cobro')
router.register(r'acciones', AccionViewSet, basename='accion')
router.register(r'actividades', ActividadViewSet, basename='actividad')
router.register(r'entregables', EntregableViewSet, basename='entregable')
router.register(r'fichas-has-acciones', FichaHasAccionViewSet, basename='fichahasaccion')
router.register(r'cronograma', CronogramaActividadViewSet, basename='cronogramaactividad')

urlpatterns = [
    path('', include('src.routes.auth_routes')),
    path('', include(router.urls)),
]
