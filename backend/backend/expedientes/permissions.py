from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.rol is not None and
            request.user.rol.nombre.lower() == 'administrador'
        )


class EsCapturistaOAdministrador(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.rol is not None and
            request.user.rol.nombre.lower() in ['administrador', 'capturista']
        )


class EsAnalistaOAdministrador(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.rol is not None and
            request.user.rol.nombre.lower() in ['administrador', 'analista']
        )


class SoloLecturaPorRol(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.rol is None:
            return False

        rol = request.user.rol.nombre.lower()

        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return rol in ['administrador', 'capturista', 'analista', 'consulta']

        return False