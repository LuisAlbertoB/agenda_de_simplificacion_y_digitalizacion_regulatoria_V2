from django.contrib import admin
from src.models import (
    Role,
    Permiso,
    RoleHasPermiso,
    Dependencia,
    Usuario,
    TramiteOServicio,
    Agenda,
    Ficha,
    Cobro,
    Accion,
    Actividad,
    Entregable,
    FichaHasAccion,
    CronogramaActividad,
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id_role', 'clave', 'nombre_oficial', 'siglas', 'status', 'created_at')
    search_fields = ('clave', 'nombre_oficial', 'siglas')
    list_filter = ('status',)


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('id_permiso', 'clave', 'valor', 'created_at')
    search_fields = ('clave',)
    list_filter = ('valor',)


@admin.register(RoleHasPermiso)
class RoleHasPermisoAdmin(admin.ModelAdmin):
    list_display = ('id_role_has_permiso', 'id_role', 'id_permiso', 'created_at')
    list_filter = ('id_role', 'id_permiso')


@admin.register(Dependencia)
class DependenciaAdmin(admin.ModelAdmin):
    list_display = ('id_dependencia', 'clave', 'nombre_oficial', 'siglas', 'titular_dependencia', 'ambito', 'status')
    search_fields = ('clave', 'nombre_oficial', 'siglas', 'titular_dependencia')
    list_filter = ('ambito', 'status')


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'correo_electronico', 'nombres', 'apellido1', 'id_dependencia', 'id_role', 'is_staff', 'status')
    search_fields = ('correo_electronico', 'nombres', 'apellido1', 'curp')
    list_filter = ('status', 'is_staff', 'is_superuser', 'id_role', 'id_dependencia')


@admin.register(TramiteOServicio)
class TramiteOServicioAdmin(admin.ModelAdmin):
    list_display = ('id_tramite_servicio', 'clave', 'nombre_oficial', 'tipo', 'tramite_o_servicio', 'created_at')
    search_fields = ('clave', 'nombre_oficial')
    list_filter = ('tipo', 'tramite_o_servicio')


@admin.register(Agenda)
class AgendaAdmin(admin.ModelAdmin):
    list_display = ('id_agenda', 'id_dependencia', 'anio', 'semestre', 'unidad_administrativa', 'status', 'created_at')
    search_fields = ('unidad_administrativa', 'titular_unidad_admin')
    list_filter = ('anio', 'semestre', 'status', 'id_dependencia')


@admin.register(Ficha)
class FichaAdmin(admin.ModelAdmin):
    list_display = ('id_ficha', 'id_agenda', 'id_tramite_servicio', 'solicitud_tipo', 'status')
    search_fields = ('vigencia_del_documento_obtenido',)
    list_filter = ('solicitud_tipo', 'nivel_digitalizacion_actual', 'status')


@admin.register(Cobro)
class CobroAdmin(admin.ModelAdmin):
    list_display = ('id_cobros', 'id_ficha', 'concepto', 'unidad_medida', 'importe', 'created_at')
    search_fields = ('concepto',)
    list_filter = ('unidad_medida',)


@admin.register(Accion)
class AccionAdmin(admin.ModelAdmin):
    list_display = ('id_accion', 'clave', 'titulo', 'simplificacion_o_digitalizacion', 'created_at')
    search_fields = ('clave', 'titulo')
    list_filter = ('simplificacion_o_digitalizacion',)


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ('id_actividades', 'id_accion', 'clave', 'titulo', 'created_at')
    search_fields = ('clave', 'titulo')
    list_filter = ('id_accion',)


@admin.register(Entregable)
class EntregableAdmin(admin.ModelAdmin):
    list_display = ('id_entregable', 'id_actividad', 'clave', 'titulo', 'status', 'created_at')
    search_fields = ('clave', 'titulo')
    list_filter = ('status',)


@admin.register(FichaHasAccion)
class FichaHasAccionAdmin(admin.ModelAdmin):
    list_display = ('id_fichas_has_accion', 'id_ficha', 'id_accion', 'created_at')
    list_filter = ('id_ficha', 'id_accion')


@admin.register(CronogramaActividad)
class CronogramaActividadAdmin(admin.ModelAdmin):
    list_display = ('id_cronograma', 'id_ficha', 'id_accion', 'num_mes_inicio_plazo', 'num_mes_final_plazo', 'created_at')
    list_filter = ('num_mes_inicio_plazo', 'num_mes_final_plazo')
