"""
MegaMercados - Vistas de Productos y Categorías
Principio SRP: gestión exclusiva del catálogo de productos
"""
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from megamercados.apps.core.permissions import EsAdministrador
from .models import Producto, Categoria
from .serializers import ProductoSerializer, CategoriaSerializer, ProductoAdminSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías del catálogo."""

    queryset = Categoria.objects.filter(activo=True)
    serializer_class = CategoriaSerializer

    def get_permissions(self):
        """Solo admin puede modificar categorías; todos pueden leer."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [EsAdministrador()]
        return [AllowAny()]

    @swagger_auto_schema(
        operation_id='categorias_listar',
        operation_summary='Listar Categorías',
        operation_description='Lista todas las categorías activas del catálogo.',
        tags=['Catálogo']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='categorias_crear',
        operation_summary='Crear Categoría',
        operation_description='Crea una nueva categoría. **Solo Administradores.**',
        security=[{'Bearer': []}],
        tags=['Catálogo']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gestión del catálogo de productos.
    Administradores: CRUD completo.
    Clientes/Invitados: solo lectura.
    """

    queryset = Producto.objects.select_related('categoria').filter(activo=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'activo', 'destacado']
    search_fields = ['nombre', 'descripcion', 'codigo']
    ordering_fields = ['nombre', 'precio', 'stock', 'fecha_creacion']
    ordering = ['nombre']

    def get_permissions(self):
        """Permisos dinámicos: escritura solo para admins."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [EsAdministrador()]
        return [AllowAny()]

    def get_serializer_class(self):
        """Admin ve más campos, clientes ven vista simplificada."""
        if self.request.user.is_authenticated and self.request.user.es_administrador:
            return ProductoAdminSerializer
        return ProductoSerializer

    @swagger_auto_schema(
        operation_id='productos_listar',
        operation_summary='Catálogo de Productos',
        operation_description="""
        Lista todos los productos activos del catálogo con paginación.
        Soporta filtros por categoría, búsqueda y ordenamiento.
        """,
        manual_parameters=[
            openapi.Parameter('categoria', openapi.IN_QUERY, type=openapi.TYPE_INTEGER,
                              description='Filtrar por ID de categoría'),
            openapi.Parameter('search', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                              description='Búsqueda por nombre o código'),
            openapi.Parameter('ordering', openapi.IN_QUERY, type=openapi.TYPE_STRING,
                              description='Ordenar por: nombre, precio, -precio'),
            openapi.Parameter('destacado', openapi.IN_QUERY, type=openapi.TYPE_BOOLEAN,
                              description='Filtrar productos destacados'),
        ],
        tags=['Catálogo']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='productos_detalle',
        operation_summary='Detalle de Producto',
        operation_description='Retorna la información completa de un producto.',
        tags=['Catálogo']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='productos_crear',
        operation_summary='Crear Producto',
        operation_description='Agrega un nuevo producto al catálogo. **Solo Administradores.**',
        security=[{'Bearer': []}],
        tags=['Catálogo']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='productos_actualizar',
        operation_summary='Actualizar Producto',
        operation_description='Actualiza datos de un producto, incluyendo precio. **Solo Administradores.**',
        security=[{'Bearer': []}],
        tags=['Catálogo']
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='productos_destacados',
        operation_summary='Productos Destacados',
        operation_description='Lista los productos marcados como destacados.',
        tags=['Catálogo']
    )
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def destacados(self, request):
        """Retorna productos destacados para el banner principal."""
        productos = self.queryset.filter(destacado=True, stock__gt=0)[:12]
        serializer = ProductoSerializer(productos, many=True, context={'request': request})
        return Response({'success': True, 'productos': serializer.data})

    @swagger_auto_schema(
        operation_id='productos_actualizar_precio',
        operation_summary='Actualizar Precio',
        operation_description='Actualiza el precio de un producto. **Solo Administradores.**',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['precio'],
            properties={
                'precio': openapi.Schema(type=openapi.TYPE_NUMBER, description='Nuevo precio en Q'),
            }
        ),
        security=[{'Bearer': []}],
        tags=['Catálogo']
    )
    @action(detail=True, methods=['patch'], permission_classes=[EsAdministrador])
    def actualizar_precio(self, request, pk=None):
        """Permite a administradores actualizar el precio de un producto."""
        producto = self.get_object()
        nuevo_precio = request.data.get('precio')

        if not nuevo_precio or float(nuevo_precio) <= 0:
            return Response(
                {'success': False, 'mensaje': 'El precio debe ser mayor a 0.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        producto.precio = nuevo_precio
        producto.save(update_fields=['precio'])

        return Response({
            'success': True,
            'mensaje': f'Precio actualizado a Q{nuevo_precio}.',
            'producto': ProductoSerializer(producto).data
        })
