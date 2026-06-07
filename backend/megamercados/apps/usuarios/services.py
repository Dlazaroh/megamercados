"""
MegaMercados - Servicio de Autenticación
Implementación de IAutenticacionServicio.
Principio SRP: responsabilidad única de autenticación.
Principio DIP: depende de abstracciones (IAutenticacionServicio).
"""
import logging
from typing import Optional, Dict, Any

from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.cache import cache

from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from megamercados.apps.core.interfaces import IAutenticacionServicio
from .models import Usuario

logger = logging.getLogger('megamercados')


class AutenticacionServicio(IAutenticacionServicio):
    """
    Implementación concreta del servicio de autenticación JWT.
    Usa JWT para tokens y bcrypt (vía Django) para contraseñas.
    """

    TOKEN_RECUPERACION_TTL = 3600  # 1 hora en segundos
    TOKEN_RECUPERACION_PREFIX = 'recuperar_pwd_'

    def autenticar(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Autentica usando email y contraseña, retorna tokens JWT.
        """
        usuario = authenticate(username=username, password=password)

        if not usuario:
            logger.warning(f"Intento de autenticación fallido para: {username}")
            return None

        if not usuario.is_active:
            logger.warning(f"Intento de acceso a cuenta inactiva: {username}")
            return None

        refresh = RefreshToken.for_user(usuario)
        access = refresh.access_token

        # Agregar claims personalizados al token
        access['rol'] = usuario.rol
        access['nombre'] = usuario.nombre_completo
        access['email'] = usuario.email

        logger.info(f"Autenticación exitosa: {username} (rol: {usuario.rol})")

        return {
            'access_token': str(access),
            'refresh_token': str(refresh),
            'token_type': 'Bearer',
            'usuario': {
                'id': usuario.id,
                'email': usuario.email,
                'nombre_completo': usuario.nombre_completo,
                'rol': usuario.rol,
            }
        }

    def cerrar_sesion(self, refresh_token: str) -> bool:
        """
        Invalida el refresh token (blacklist).
        """
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("Sesión cerrada, token invalidado.")
            return True
        except TokenError as e:
            logger.warning(f"Error al cerrar sesión: {e}")
            return False

    def refrescar_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """
        Genera nuevo access token desde refresh token válido.
        """
        try:
            token = RefreshToken(refresh_token)
            access = token.access_token

            # Recargar claims del usuario actual
            usuario = Usuario.objects.get(id=token['user_id'])
            access['rol'] = usuario.rol
            access['nombre'] = usuario.nombre_completo
            access['email'] = usuario.email

            return {
                'access_token': str(access),
                'token_type': 'Bearer',
            }
        except (TokenError, Usuario.DoesNotExist) as e:
            logger.warning(f"Error al refrescar token: {e}")
            return None

    def recuperar_contrasena(self, email: str) -> bool:
        """
        Envía email de recuperación si el usuario existe.
        Siempre retorna True para evitar enumeración de usuarios.
        """
        try:
            usuario = Usuario.objects.get(email=email, is_active=True)
            token = get_random_string(64)
            cache_key = f"{self.TOKEN_RECUPERACION_PREFIX}{token}"

            # Guardar token en cache con TTL de 1 hora
            cache.set(cache_key, usuario.id, self.TOKEN_RECUPERACION_TTL)

            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

            send_mail(
                subject='MegaMercados - Recuperación de Contraseña',
                message=f"""
Hola {usuario.nombre},

Recibimos una solicitud para restablecer tu contraseña.
Haz clic en el siguiente enlace (válido por 1 hora):

{reset_url}

Si no solicitaste este cambio, ignora este correo.

Equipo MegaMercados
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"Email de recuperación enviado a: {email}")

        except Usuario.DoesNotExist:
            logger.warning(f"Recuperación solicitada para email no registrado: {email}")

        return True  # Siempre True para seguridad

    def validar_token_recuperacion(self, token: str) -> Optional[int]:
        """
        Valida el token de recuperación y retorna el ID del usuario.
        """
        cache_key = f"{self.TOKEN_RECUPERACION_PREFIX}{token}"
        usuario_id = cache.get(cache_key)
        return usuario_id

    def completar_recuperacion(self, token: str, nueva_password: str) -> bool:
        """
        Completa el proceso de recuperación cambiando la contraseña.
        """
        usuario_id = self.validar_token_recuperacion(token)
        if not usuario_id:
            return False

        try:
            usuario = Usuario.objects.get(id=usuario_id, is_active=True)
            usuario.set_password(nueva_password)
            usuario.save()

            # Invalidar token
            cache_key = f"{self.TOKEN_RECUPERACION_PREFIX}{token}"
            cache.delete(cache_key)

            logger.info(f"Contraseña restablecida para usuario ID: {usuario_id}")
            return True

        except Usuario.DoesNotExist:
            return False
