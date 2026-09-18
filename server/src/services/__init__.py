from src.services.auth_serializer import CustomTokenObtainPairSerializer
from src.services.role_serializer import RoleSerializer, RoleMinSerializer
from src.services.role_service import RoleService
from src.services.permiso_serializer import PermisoSerializer
from src.services.permiso_service import PermisoService
from src.services.role_has_permiso_serializer import RoleHasPermisoSerializer
from src.services.role_has_permiso_service import RoleHasPermisoService
from src.services.dependencia_serializer import DependenciaSerializer, DependenciaMinSerializer
from src.services.dependencia_service import DependenciaService
from src.services.usuario_serializer import UsuarioSerializer
from src.services.usuario_service import UsuarioService
from src.services.tramite_o_servicio_serializer import TramiteOServicioSerializer
from src.services.tramite_o_servicio_service import TramiteOServicioService
from src.services.agenda_serializer import AgendaSerializer
from src.services.agenda_service import AgendaService
from src.services.ficha_serializer import FichaSerializer
from src.services.ficha_service import FichaService
from src.services.cobro_serializer import CobroSerializer
from src.services.cobro_service import CobroService
from src.services.accion_serializer import AccionSerializer
from src.services.accion_service import AccionService
from src.services.actividad_serializer import ActividadSerializer
from src.services.actividad_service import ActividadService
from src.services.entregable_serializer import EntregableSerializer
from src.services.entregable_service import EntregableService
from src.services.ficha_has_accion_serializer import FichaHasAccionSerializer
from src.services.ficha_has_accion_service import FichaHasAccionService
from src.services.cronograma_actividad_serializer import CronogramaActividadSerializer
from src.services.cronograma_actividad_service import CronogramaActividadService

__all__ = [
    'CustomTokenObtainPairSerializer',
    'RoleSerializer',
    'RoleMinSerializer',
    'RoleService',
    'PermisoSerializer',
    'PermisoService',
    'RoleHasPermisoSerializer',
    'RoleHasPermisoService',
    'DependenciaSerializer',
    'DependenciaMinSerializer',
    'DependenciaService',
    'UsuarioSerializer',
    'UsuarioService',
    'TramiteOServicioSerializer',
    'TramiteOServicioService',
    'AgendaSerializer',
    'AgendaService',
    'FichaSerializer',
    'FichaService',
    'CobroSerializer',
    'CobroService',
    'AccionSerializer',
    'AccionService',
    'ActividadSerializer',
    'ActividadService',
    'EntregableSerializer',
    'EntregableService',
    'FichaHasAccionSerializer',
    'FichaHasAccionService',
    'CronogramaActividadSerializer',
    'CronogramaActividadService',
]
