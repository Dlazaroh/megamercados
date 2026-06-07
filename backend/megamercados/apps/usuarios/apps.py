from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'megamercados.apps.usuarios'
    verbose_name = 'Usuarios'

    def ready(self):
        """Señales de la app de usuarios."""
        pass
