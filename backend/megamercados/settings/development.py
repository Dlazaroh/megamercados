"""
MegaMercados - Configuración de Desarrollo
"""
from .base import *  # noqa
from decouple import config

DEBUG = True

ALLOWED_HOSTS = ['*']

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ─── Email en Desarrollo (consola) ────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ─── Swagger UI disponible en desarrollo ──────────────────────────────────────
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Ingresa: Bearer <JWT Token>',
        },
        'OAuth2': {
            'type': 'oauth2',
            'flow': 'password',
            'tokenUrl': '/o/token/',
            'scopes': {
                'read': 'Acceso de lectura',
                'write': 'Acceso de escritura',
                'admin': 'Acceso de administrador',
            },
        },
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
    'SUPPORTED_SUBMIT_METHODS': ['get', 'post', 'put', 'patch', 'delete'],
    'DEFAULT_MODEL_RENDERING': 'model',
    'DOC_EXPANSION': 'list',
}

REDOC_SETTINGS = {
    'LAZY_RENDERING': False,
}
