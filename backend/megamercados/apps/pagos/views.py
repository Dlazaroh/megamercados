"""MegaMercados - Vistas de Pagos y Webhooks Stripe"""
import logging
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import StripeServicio
from megamercados.apps.pedidos.models import Pedido, EstadoPedido

logger = logging.getLogger('megamercados')

class StripeWebhookView(APIView):
    """Endpoint para recibir eventos de Stripe Webhook."""
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_id='pagos_webhook',
        operation_summary='Stripe Webhook',
        operation_description='Endpoint para eventos de Stripe. No requiere autenticación.',
        tags=['Pagos']
    )
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        stripe_servicio = StripeServicio()
        evento = stripe_servicio.procesar_webhook(payload, sig_header)
        if not evento:
            return Response({'error': 'Webhook inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        if evento['type'] == 'payment_intent.succeeded':
            pi_id = evento['data']['object']['id']
            pedido_id = evento['data']['object'].get('metadata', {}).get('pedido_id')
            if pedido_id:
                try:
                    pedido = Pedido.objects.get(id=pedido_id, stripe_payment_intent_id=pi_id)
                    if pedido.estado == EstadoPedido.PENDIENTE:
                        for detalle in pedido.detalles.all():
                            detalle.producto.reducir_stock(detalle.cantidad)
                        pedido.estado = EstadoPedido.PAGADO
                        pedido.save(update_fields=['estado'])
                        logger.info(f"Pedido #{pedido_id} marcado como PAGADO via webhook")
                except Pedido.DoesNotExist:
                    logger.warning(f"Pedido {pedido_id} no encontrado en webhook")
        
        return Response({'received': True})
