"""
MegaMercados - Admin de Usuarios
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    """Configuración del panel de administración para el modelo Usuario."""

    list_display = ['email', 'nombre_completo', 'rol', 'is_active', 'fecha_creacion']
    list_filter = ['rol', 'is_active', 'fecha_creacion']
    search_fields = ['email', 'nombre', 'apellido', 'nit']
    ordering = ['-fecha_creacion']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']

    fieldsets = (
        (_('Credenciales'), {'fields': ('email', 'password')}),
        (_('Información Personal'), {'fields': ('nombre', 'apellido', 'telefono', 'direccion', 'nit')}),
        (_('Rol y Permisos'), {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Fechas'), {'fields': ('fecha_creacion', 'fecha_actualizacion', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellido', 'rol', 'password1', 'password2'),
        }),
    )
