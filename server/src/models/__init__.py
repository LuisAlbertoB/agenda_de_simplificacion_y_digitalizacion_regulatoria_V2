"""
Modelos de la aplicación Agenda de Simplificación y Digitalización Regulatoria.

Módulo 1 — Seguridad y Control de Acceso (RBAC):
  Role, Permiso, RoleHasPermiso, Dependencia, Usuario

Módulo 2 — Trámites, Servicios y Agendas:
  TramiteOServicio, TramiteTipoAtencion, Agenda, Ficha, Cobro

Módulo 3 — Acciones, Actividades, Entregables y Cronogramas:
  Accion, Actividad, Entregable, FichaHasAccion, CronogramaActividad
"""

# ── Módulo 1: RBAC ────────────────────────────────────────────────────────────
from .role import Role
from .permiso import Permiso
from .dependencia import Dependencia
from .usuario import Usuario, UsuarioManager
from .role_has_permiso import RoleHasPermiso

# ── Módulo 2: Trámites, Servicios y Agendas ───────────────────────────────────
from .tramite_o_servicio import TramiteOServicio
from .tramite_tipo_atencion import TramiteTipoAtencion
from .agenda import Agenda
from .ficha import Ficha
from .ficha_nivel_digitalizacion import FichaNivelDigitalizacion
from .cobro import Cobro

# ── Módulo 3: Acciones, Actividades, Entregables y Cronogramas ────────────────
from .accion import Accion
from .actividad import Actividad
from .entregable import Entregable
from .ficha_has_accion import FichaHasAccion
from .cronograma_actividad import CronogramaActividad

__all__ = [
    # Módulo 1
    'Role',
    'Permiso',
    'Dependencia',
    'Usuario',
    'UsuarioManager',
    'RoleHasPermiso',
    # Módulo 2
    'TramiteOServicio',
    'TramiteTipoAtencion',
    'Agenda',
    'Ficha',
    'FichaNivelDigitalizacion',
    'Cobro',
    # Módulo 3
    'Accion',
    'Actividad',
    'Entregable',
    'FichaHasAccion',
    'CronogramaActividad',
]
