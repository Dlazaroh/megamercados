"""
MegaMercados - Permisos Personalizados
Principio SRP: cada clase de permiso tiene una responsabilidad única
"""
from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    """Permiso exclusivo para usuarios con rol Administrador."""

    message = 'Solo los administradores pueden realizar esta acción.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ADMINISTRADOR'
        )


class EsClienteAutenticado(BasePermission):
    """Permiso para clientes autenticados (mayorista, minorista)."""

    message = 'Debes iniciar sesión para realizar esta acción.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['MAYORISTA', 'MINORISTA', 'ADMINISTRADOR']
        )


class EsMayoristaOAdmin(BasePermission):
    """Permiso para mayoristas o administradores."""

    message = 'Esta acción requiere cuenta de mayorista o administrador.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['MAYORISTA', 'ADMINISTRADOR']
        )


class EsPropietarioOAdmin(BasePermission):
    """Permiso para acceder a recursos propios o como administrador."""

    message = 'Solo puedes acceder a tus propios recursos.'

    def has_object_permission(self, request, view, obj):
        if request.user.rol == 'ADMINISTRADOR':
            return True
        # Verifica si el objeto pertenece al usuario
        return getattr(obj, 'usuario', None) == request.user
