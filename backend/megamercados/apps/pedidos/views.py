"""
MegaMercados - Vistas de Pedidos
Principio SRP: gestión exclusiva de pedidos
Implementa reglas de negocio de descuentos y procesamiento de pagos
"""
import logging
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from megamercados.apps.core.permissions import EsAdministrador, EsPropietarioOAdmin
from megamercados.apps.core.exceptions import StockInsuficienteException
from megamercados.apps.productos.models import Producto
from .models import Pedido, DetallePedido, EstadoPedido
from .serializers import PedidoSerializer, CrearPedidoSerializer

logger = logging.getLogger('megamercados')


class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de pedidos.
    Aplica descuentos automáticos según las reglas de negocio:
    - Minorista > Q200: 10% descuento
    - Mayorista > Q1,000: 15% descuento
    """

    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra pedidos según el rol del usuario.
        Administradores ven todos; clientes solo los suyos.
        """
        user = self.request.user
        if user.es_administrador:
            return Pedido.objects.prefetch_related('detalles__producto').all()
        return Pedido.objects.prefetch_related('detalles__producto').filter(usuario=user)

    @swagger_auto_schema(
        operation_id='pedidos_listar',
        operation_summary='Mis Pedidos',
        operation_description='Lista todos los pedidos del usuario autenticado. Admins ven todos.',
        security=[{'Bearer': []}],
        tags=['Pedidos']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_id='pedidos_crear',
        operation_summary='Crear Pedido',
        operation_description="""
        Crea un nuevo pedido con los productos del carrito.

        **Reglas de negocio:**
        - Minorista: 10% descuento si subtotal > Q200.00
        - Mayorista: 15% descuento si subtotal > Q1,000.00

        Retorna el `client_secret` de Stripe para procesar el pago en el frontend.
        """,
        request_body=CrearPedidoSerializer,
        security=[{'Bearer': []}],
        tags=['Pedidos']
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def crear_pedido(self, request):
        """
        Crea pedido, valida stock, calcula descuentos y crea intento de pago Stripe.
        """
        serializer = CrearPedidoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errores': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        items = serializer.validated_data['items']

        # 1. Validar stock de todos los productos antes de crear
        productos_validos = []
        for item in items:
            try:
                producto = Producto.objects.get(id=item['producto_id'], activo=True)
            except Producto.DoesNotExist:
                return Response(
                    {'success': False, 'mensaje': f"Producto ID {item['producto_id']} no existe."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if producto.stock < item['cantidad']:
                raise StockInsuficienteException(producto.nombre, producto.stock)

            productos_validos.append((producto, item['cantidad']))

        # 2. Crear el pedido
        pedido = Pedido.objects.create(
            usuario=request.user,
            notas=serializer.validated_data.get('notas', '')
        )

        # 3. Crear detalles con precio snapshot
        for producto, cantidad in productos_validos:
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=producto.precio
            )

        # 4. Calcular totales con reglas de negocio de descuentos
        pedido.calcular_totales()

        # 5. Crear Payment Intent en Stripe
        from megamercados.apps.pagos.services import StripeServicio
        stripe_servicio = StripeServicio()

        try:
            resultado_pago = stripe_servicio.crear_intento_pago(
                monto=pedido.total,
                moneda='gtq',
                metadata={
                    'pedido_id': str(pedido.id),
                    'usuario_id': str(request.user.id),
                    'usuario_rol': request.user.rol,
                }
            )
            pedido.stripe_payment_intent_id = resultado_pago['payment_intent_id']
            pedido.stripe_client_secret = resultado_pago['client_secret']
            pedido.save(update_fields=['stripe_payment_intent_id', 'stripe_client_secret'])
        except Exception as e:
            logger.error(f"Error al crear Payment Intent para pedido {pedido.id}: {e}")
            pedido.delete()
            return Response(
                {'success': False, 'mensaje': 'Error al inicializar el pago. Intenta nuevamente.'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        logger.info(f"Pedido #{pedido.id} creado. Total: Q{pedido.total} (Descuento: {pedido.descuento_porcentaje}%)")

        return Response(
            {
                'success': True,
                'pedido': PedidoSerializer(pedido, context={'request': request}).data,
                'client_secret': pedido.stripe_client_secret,
                'stripe_publishable_key': __import__('django.conf', fromlist=['settings']).settings.STRIPE_PUBLISHABLE_KEY,
            },
            status=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(
        operation_id='pedidos_confirmar_pago',
        operation_summary='Confirmar Pago',
        operation_description='Confirma el pago de un pedido y actualiza el inventario.',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['payment_intent_id'],
            properties={
                'payment_intent_id': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        security=[{'Bearer': []}],
        tags=['Pedidos']
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirmar_pago(self, request, pk=None):
        """
        Confirma el pago, actualiza estado del pedido y reduce el inventario.
        """
        pedido = self.get_object()

        if pedido.estado != EstadoPedido.PENDIENTE:
            return Response(
                {'success': False, 'mensaje': 'Este pedido ya fue procesado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from megamercados.apps.pagos.services import StripeServicio
        stripe_servicio = StripeServicio()

        pago_confirmado = stripe_servicio.confirmar_pago(
            pedido.stripe_payment_intent_id
        )

        if not pago_confirmado:
            return Response(
                {'success': False, 'mensaje': 'El pago no ha sido completado.'},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # Actualizar inventario para cada producto
        for detalle in pedido.detalles.all():
            if not detalle.producto.reducir_stock(detalle.cantidad):
                logger.error(f"Stock insuficiente al confirmar pedido {pedido.id} para producto {detalle.producto.id}")

        pedido.estado = EstadoPedido.PAGADO
        pedido.save(update_fields=['estado'])

        logger.info(f"Pago confirmado para pedido #{pedido.id}")

        return Response({
            'success': True,
            'mensaje': '¡Pago confirmado! Tu pedido está siendo procesado.',
            'pedido': PedidoSerializer(pedido, context={'request': request}).data
        })
