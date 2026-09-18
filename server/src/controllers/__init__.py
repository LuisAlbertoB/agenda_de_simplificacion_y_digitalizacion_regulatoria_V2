from src.controllers.auth_controller import CustomTokenObtainPairView
from src.controllers.role_controller import RoleViewSet
from src.controllers.permiso_controller import PermisoViewSet
from src.controllers.role_has_permiso_controller import RoleHasPermisoViewSet
from src.controllers.dependencia_controller import DependenciaViewSet
from src.controllers.usuario_controller import UsuarioViewSet
from src.controllers.tramite_o_servicio_controller import TramiteOServicioViewSet
from src.controllers.agenda_controller import AgendaViewSet
from src.controllers.ficha_controller import FichaViewSet
from src.controllers.cobro_controller import CobroViewSet
from src.controllers.accion_controller import AccionViewSet
from src.controllers.actividad_controller import ActividadViewSet
from src.controllers.entregable_controller import EntregableViewSet
from src.controllers.ficha_has_accion_controller import FichaHasAccionViewSet
from src.controllers.cronograma_actividad_controller import CronogramaActividadViewSet

__all__ = [
    'CustomTokenObtainPairView',
    'RoleViewSet',
    'PermisoViewSet',
    'RoleHasPermisoViewSet',
    'DependenciaViewSet',
    'UsuarioViewSet',
    'TramiteOServicioViewSet',
    'AgendaViewSet',
    'FichaViewSet',
    'CobroViewSet',
    'AccionViewSet',
    'ActividadViewSet',
    'EntregableViewSet',
    'FichaHasAccionViewSet',
    'CronogramaActividadViewSet',
]
