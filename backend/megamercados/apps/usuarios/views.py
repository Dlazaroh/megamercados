"""
MegaMercados - Vistas de Usuarios
Principio SRP: gestión de perfiles y administración de usuarios
"""
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from megamercados.apps.core.permissions import EsAdministrador, EsPropietarioOAdmin
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioPerfilSerializer, CambioContrasenaSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios.
    Solo administradores pueden listar y gestionar todos los usuarios.
    Los usuarios solo pueden acceder/editar su propio perfil.
    """

    queryset = Usuario.objects.all().order_by('-fecha_creacion')
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        """
        Aplica permisos dinámicos según la acción.
        Principio OCP: nuevas acciones se agregan sin modificar esta lógica.
        """
        if self.action in ['list', 'create', 'destroy']:
            return [EsAdministrador()]
        return [IsAuthenticated(), EsPropietarioOAdmin()]

    def get_serializer_class(self):
        if self.action in ['perfil', 'actualizar_perfil']:
            return UsuarioPerfilSerializer
        if self.action == 'cambiar_contrasena':
            return CambioContrasenaSerializer
        return UsuarioSerializer

    @swagger_auto_schema(
        operation_id='usuarios_listar',
        operation_summary='Listar Usuarios',
        operation_description='Lista todos los usuarios. **Solo Administradores.**',
        manual_parameters=[
            openapi.Parameter('rol', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                              enum=['ADMINISTRADOR', 'MAYORISTA', 'MINORISTA', 'INVITADO']),
            openapi.Parameter('search', openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        security=[{'Bearer': []}],
        tags=['Usuarios']
    )
    def list(self, request, *args, **kwargs):
        """Lista usuarios con filtros opcionales."""
        rol = request.query_params.get('rol')
        if rol:
            self.queryset = self.queryset.filter(rol=rol)
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='usuarios_perfil',
        operation_summary='Mi Perfil',
        operation_description='Retorna el perfil del usuario autenticado.',
        security=[{'Bearer': []}],
        tags=['Usuarios']
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def perfil(self, request):
        """Retorna el perfil del usuario autenticado."""
        serializer = UsuarioSerializer(request.user)
        return Response({'success': True, 'usuario': serializer.data})

    @swagger_auto_schema(
        operation_id='usuarios_actualizar_perfil',
        operation_summary='Actualizar Perfil',
        operation_description='Actualiza los datos del perfil del usuario autenticado.',
        request_body=UsuarioPerfilSerializer,
        security=[{'Bearer': []}],
        tags=['Usuarios']
    )
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def actualizar_perfil(self, request):
        """Actualiza el perfil del usuario autenticado."""
        serializer = UsuarioPerfilSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'mensaje': 'Perfil actualizado.',
                'usuario': UsuarioSerializer(request.user).data
            })
        return Response(
            {'success': False, 'errores': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    @swagger_auto_schema(
        operation_id='usuarios_cambiar_contrasena',
        operation_summary='Cambiar Contraseña',
        operation_description='Permite al usuario cambiar su contraseña actual.',
        request_body=CambioContrasenaSerializer,
        security=[{'Bearer': []}],
        tags=['Usuarios']
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cambiar_contrasena(self, request):
        """Cambia la contraseña del usuario autenticado."""
        serializer = CambioContrasenaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errores': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario = request.user
        if not usuario.check_password(serializer.validated_data['password_actual']):
            return Response(
                {'success': False, 'mensaje': 'Contraseña actual incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario.set_password(serializer.validated_data['password_nuevo'])
        usuario.save()

        return Response(
            {'success': True, 'mensaje': 'Contraseña actualizada exitosamente.'},
            status=status.HTTP_200_OK
        )
