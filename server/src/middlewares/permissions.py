from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsRootUser(BasePermission):
    """
    Permiso personalizado que concede acceso si el usuario es superusuario de Django
    o si pertenece al rol 'administrador' (clave 'ADMIN' / nivel 2).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        if request.user.id_role and request.user.id_role.clave in ['ADMIN', 'ROOT', 'SUPERADMIN']:
            return True
        return False


class IsOwner(BasePermission):
    """
    Permiso que autoriza únicamente al usuario creador del recurso (created_by == request.user).
    """

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        return hasattr(obj, 'created_by') and obj.created_by == request.user


class HasModulePermission(BasePermission):
    """
    Permiso granular por módulo basado en la relación roles_has_permisos.
    TODO(seguridad): Implementar en Sprint 2 la consulta dinámica a roles_has_permisos
    filtrando por clave de permiso y valor (0=sin_permiso, 1=lectura, 2=escritura).
    """

    def has_permission(self, request, view):
        raise NotImplementedError(
            "El permiso HasModulePermission granular por roles_has_permisos se conectará en el Sprint 2."
        )
