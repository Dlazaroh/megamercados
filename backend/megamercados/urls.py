"""
MegaMercados - Enrutamiento Principal
Patrón de Diseño: API Gateway - punto único de entrada para todas las rutas
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# ─── Configuración Swagger UI ─────────────────────────────────────────────────
schema_view = get_schema_view(
    openapi.Info(
        title="MegaMercados API",
        default_version='v1',
        description="""
        ## API de MegaMercados E-commerce

        Sistema de comercio electrónico para supermercados con soporte para clientes
        mayoristas, minoristas e invitados.

        ### Autenticación
        - **JWT Bearer Token**: Incluye `Authorization: Bearer <token>` en los headers
        - **OAuth2 Password Flow**: Usa el endpoint `/o/token/` para obtener tokens

        ### Reglas de Negocio
        - **Minorista**: Descuento del 10% en compras mayores a Q200.00
        - **Mayorista**: Descuento del 15% en compras mayores a Q1,000.00

        ### Roles
        - **Administrador**: Gestión completa del catálogo y reportes
        - **Mayorista**: Precios especiales y descuentos por volumen
        - **Minorista**: Precios estándar con descuento por monto
        - **Invitado**: Solo lectura del catálogo
        """,
        terms_of_service="https://megamercados.com/terminos/",
        contact=openapi.Contact(email="soporte@megamercados.com"),
        license=openapi.License(name="Licencia Comercial"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],
)

# ─── URLs Principales (API Gateway) ───────────────────────────────────────────
urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),

    # OAuth2 Endpoints
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),

    # API v1 - Gateway centralizado
    path('api/v1/auth/', include('megamercados.apps.usuarios.urls.auth_urls')),
    path('api/v1/usuarios/', include('megamercados.apps.usuarios.urls.usuario_urls')),
    path('api/v1/productos/', include('megamercados.apps.productos.urls')),
    path('api/v1/pedidos/', include('megamercados.apps.pedidos.urls')),
    path('api/v1/pagos/', include('megamercados.apps.pagos.urls')),

    # Swagger / Redoc Documentation
    re_path(
        r'^swagger(?P<format>\.json|\.yaml)$',
        schema_view.without_ui(cache_timeout=0),
        name='schema-json'
    ),
    path(
        'swagger/',
        schema_view.with_ui('swagger', cache_timeout=0),
        name='schema-swagger-ui'
    ),
    path(
        'redoc/',
        schema_view.with_ui('redoc', cache_timeout=0),
        name='schema-redoc'
    ),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
