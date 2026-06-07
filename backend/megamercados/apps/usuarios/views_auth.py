"""
MegaMercados - Vistas de Autenticación
Principio DIP: inyección de dependencia de IAutenticacionServicio
Documentado con Swagger/drf-yasg para cada endpoint
"""
import logging
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RegistroSerializer, CambioContrasenaSerializer,
    RecuperarContrasenaSerializer, ResetContrasenaSerializer,
    UsuarioSerializer
)
from .services import AutenticacionServicio

logger = logging.getLogger('megamercados')

# ─── Inyección de Dependencia (DIP) ───────────────────────────────────────────
# El controlador depende de la abstracción IAutenticacionServicio,
# no de la implementación concreta AutenticacionServicio
_autenticacion_servicio = AutenticacionServicio()


class LoginView(APIView):
    """Vista de inicio de sesión con JWT."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_id='auth_login',
        operation_summary='Iniciar Sesión',
        operation_description="""
        Autentica al usuario con email y contraseña.
        Retorna tokens JWT (access + refresh) y datos del usuario.

        **Roles soportados:** Administrador, Mayorista, Minorista, Invitado
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['email', 'password'],
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email',
                                        example='cliente@example.com'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format='password',
                                           example='MiContrasena123!'),
            }
        ),
        responses={
            200: openapi.Response(
                description='Login exitoso',
                examples={
                    'application/json': {
                        'success': True,
                        'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                        'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                        'token_type': 'Bearer',
                        'usuario': {
                            'id': 1,
                            'email': 'cliente@example.com',
                            'nombre_completo': 'Juan García',
                            'rol': 'MINORISTA'
                        }
                    }
                }
            ),
            401: openapi.Response(description='Credenciales inválidas'),
        },
        tags=['Autenticación']
    )
    def post(self, request):
        """Autentica el usuario y retorna tokens JWT."""
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'success': False, 'mensaje': 'Email y contraseña son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultado = _autenticacion_servicio.autenticar(email, password)

        if not resultado:
            return Response(
                {'success': False, 'mensaje': 'Credenciales incorrectas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({'success': True, **resultado}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Vista para cerrar sesión e invalidar tokens."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_id='auth_logout',
        operation_summary='Cerrar Sesión',
        operation_description='Invalida el refresh token del usuario (blacklist JWT).',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['refresh_token'],
            properties={
                'refresh_token': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Token de actualización a invalidar'
                ),
            }
        ),
        responses={
            200: openapi.Response(description='Sesión cerrada exitosamente'),
            400: openapi.Response(description='Token inválido o expirado'),
        },
        security=[{'Bearer': []}],
        tags=['Autenticación']
    )
    def post(self, request):
        """Cierra la sesión invalidando el refresh token."""
        refresh_token = request.data.get('refresh_token', '')

        if not refresh_token:
            return Response(
                {'success': False, 'mensaje': 'Refresh token requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        exito = _autenticacion_servicio.cerrar_sesion(refresh_token)

        if not exito:
            return Response(
                {'success': False, 'mensaje': 'Token inválido o ya expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'success': True, 'mensaje': 'Sesión cerrada exitosamente.'},
            status=status.HTTP_200_OK
        )


class RefrescarTokenView(APIView):
    """Vista para refrescar el access token."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_id='auth_refresh_token',
        operation_summary='Refrescar Token',
        operation_description='Genera un nuevo access token usando el refresh token.',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['refresh_token'],
            properties={
                'refresh_token': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            200: openapi.Response(description='Nuevo access token generado'),
            401: openapi.Response(description='Refresh token inválido o expirado'),
        },
        tags=['Autenticación']
    )
    def post(self, request):
        """Refresca el access token."""
        refresh_token = request.data.get('refresh_token', '')

        if not refresh_token:
            return Response(
                {'success': False, 'mensaje': 'Refresh token requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultado = _autenticacion_servicio.refrescar_token(refresh_token)

        if not resultado:
            return Response(
                {'success': False, 'mensaje': 'Token inválido o expirado.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({'success': True, **resultado}, status=status.HTTP_200_OK)


class RegistroView(APIView):
    """Vista para registro de nuevos usuarios."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_id='auth_registro',
        operation_summary='Registrar Usuario',
        operation_description='Crea una nueva cuenta de usuario (Minorista por defecto).',
        request_body=RegistroSerializer,
        responses={
            201: UsuarioSerializer,
            400: openapi.Response(description='Datos inválidos o email ya registrado'),
        },
        tags=['Autenticación']
    )
    def post(self, request):
        """Registra un nuevo usuario en el sistema."""
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response(
                {
                    'success': True,
                    'mensaje': 'Usuario registrado exitosamente.',
                    'usuario': UsuarioSerializer(usuario).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'success': False, 'errores': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class RecuperarContrasenaView(APIView):
    """Vista para solicitar recuperación de contraseña."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_id='auth_recuperar_contrasena',
        operation_summary='Recuperar Contraseña',
        operation_description='Envía un email de recuperación de contraseña.',
        request_body=RecuperarContrasenaSerializer,
        responses={
            200: openapi.Response(description='Email enviado (si el correo existe)'),
        },
        tags=['Autenticación']
    )
    def post(self, request):
        """Envía email de recuperación de contraseña."""
        serializer = RecuperarContrasenaSerializer(data=request.data)
        if serializer.is_valid():
            _autenticacion_servicio.recuperar_contrasena(
                serializer.validated_data['email']
            )
        return Response(
            {
                'success': True,
                'mensaje': 'Si el correo está registrado, recibirás instrucciones en breve.'
            },
            status=status.HTTP_200_OK
        )


class ResetContrasenaView(APIView):
    """Vista para completar el reset de contraseña con token."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_id='auth_reset_contrasena',
        operation_summary='Restablecer Contraseña',
        operation_description='Restablece la contraseña usando el token recibido por email.',
        request_body=ResetContrasenaSerializer,
        responses={
            200: openapi.Response(description='Contraseña restablecida exitosamente'),
            400: openapi.Response(description='Token inválido o expirado'),
        },
        tags=['Autenticación']
    )
    def post(self, request):
        """Restablece la contraseña con el token de recuperación."""
        serializer = ResetContrasenaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errores': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        exito = _autenticacion_servicio.completar_recuperacion(
            serializer.validated_data['token'],
            serializer.validated_data['password_nuevo']
        )

        if not exito:
            return Response(
                {'success': False, 'mensaje': 'Token inválido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'success': True, 'mensaje': 'Contraseña restablecida exitosamente.'},
            status=status.HTTP_200_OK
        )
