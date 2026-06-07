"""
MegaMercados - Manejo Centralizado de Excepciones
Principio SRP: Responsabilidad única de gestión de errores
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('megamercados')


class MegaMercadosException(Exception):
    """Excepción base para errores de negocio de MegaMercados."""

    def __init__(self, mensaje: str, codigo: str = 'ERROR_NEGOCIO', status_code: int = 400):
        self.mensaje = mensaje
        self.codigo = codigo
        self.status_code = status_code
        super().__init__(self.mensaje)


class StockInsuficienteException(MegaMercadosException):
    """Excepción cuando no hay stock suficiente para un producto."""

    def __init__(self, producto_nombre: str, stock_disponible: int):
        super().__init__(
            mensaje=f"Stock insuficiente para '{producto_nombre}'. Disponible: {stock_disponible}",
            codigo='STOCK_INSUFICIENTE',
            status_code=400
        )


class PagoFallidoException(MegaMercadosException):
    """Excepción cuando falla el procesamiento del pago."""

    def __init__(self, detalle: str = ''):
        super().__init__(
            mensaje=f"El pago no pudo ser procesado. {detalle}",
            codigo='PAGO_FALLIDO',
            status_code=402
        )


class PermisoDenegadoException(MegaMercadosException):
    """Excepción cuando el usuario no tiene permisos suficientes."""

    def __init__(self, accion: str = ''):
        super().__init__(
            mensaje=f"No tienes permisos para realizar esta acción. {accion}",
            codigo='PERMISO_DENEGADO',
            status_code=403
        )


def custom_exception_handler(exc, context):
    """
    Manejador centralizado de excepciones para la API.
    Retorna respuestas JSON estandarizadas para todos los errores.
    """
    # Primero intentar el handler por defecto de DRF
    response = exception_handler(exc, context)

    if response is not None:
        # Estandarizar formato de errores de DRF
        response.data = {
            'success': False,
            'codigo': 'ERROR_VALIDACION',
            'mensaje': _extraer_mensaje_error(response.data),
            'errores': response.data,
        }
        return response

    # Manejar excepciones de negocio propias
    if isinstance(exc, MegaMercadosException):
        logger.warning(f"Error de negocio: {exc.codigo} - {exc.mensaje}")
        return Response(
            {
                'success': False,
                'codigo': exc.codigo,
                'mensaje': exc.mensaje,
            },
            status=exc.status_code
        )

    # Errores no capturados
    logger.error(f"Error no manejado: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return Response(
        {
            'success': False,
            'codigo': 'ERROR_INTERNO',
            'mensaje': 'Ha ocurrido un error interno. Por favor contacte al soporte.',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def _extraer_mensaje_error(data) -> str:
    """Extrae un mensaje legible de los datos de error de DRF."""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, list) and value:
                return f"{key}: {value[0]}"
            elif isinstance(value, str):
                return f"{key}: {value}"
    elif isinstance(data, list) and data:
        return str(data[0])
    return 'Error de validación'
