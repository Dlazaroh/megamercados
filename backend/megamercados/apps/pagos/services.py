"""
MegaMercados - Servicio de Pagos con Stripe
Implementación de IPagoServicio usando Stripe Express.
Principio DIP: depende de la abstracción IPagoServicio.
Principio SRP: responsabilidad única del procesamiento de pagos.
"""
import logging
from decimal import Decimal
from typing import Optional, Dict, Any

import stripe
from django.conf import settings

from megamercados.apps.core.interfaces import IPagoServicio
from megamercados.apps.core.exceptions import PagoFallidoException

logger = logging.getLogger('megamercados')

# Configurar Stripe con la clave secreta
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeServicio(IPagoServicio):
    """
    Implementación concreta de pagos usando Stripe Express.
    Usa Payment Intents API para flujo de pago completo.
    """

    # Stripe no soporta GTQ nativo, se usa USD como proxy en producción
    # En un ambiente real, usarías un servicio de conversión de divisas
    MONEDA_STRIPE = 'usd'

    def crear_intento_pago(
        self,
        monto: Decimal,
        moneda: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crea un Payment Intent en Stripe.

        Args:
            monto: Monto en quetzales (Q)
            moneda: Código de moneda
            metadata: Datos del pedido para trazabilidad

        Returns:
            Dict con payment_intent_id y client_secret
        """
        try:
            # Stripe maneja centavos, multiplicamos por 100
            monto_centavos = int(monto * 100)

            intent = stripe.PaymentIntent.create(
                amount=monto_centavos,
                currency=self.MONEDA_STRIPE,
                metadata=metadata,
                automatic_payment_methods={'enabled': True},
                description=f"MegaMercados - Pedido #{metadata.get('pedido_id', 'N/A')}",
            )

            logger.info(f"Payment Intent creado: {intent.id} por {monto_centavos} centavos")

            return {
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'monto': monto,
                'estado': intent.status,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Error Stripe al crear Payment Intent: {e}")
            raise PagoFallidoException(str(e))

    def confirmar_pago(self, payment_intent_id: str) -> bool:
        """
        Verifica que el Payment Intent fue confirmado exitosamente.
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            es_exitoso = intent.status == 'succeeded'

            if es_exitoso:
                logger.info(f"Pago confirmado: {payment_intent_id}")
            else:
                logger.warning(f"Pago no exitoso: {payment_intent_id} - Estado: {intent.status}")

            return es_exitoso

        except stripe.error.StripeError as e:
            logger.error(f"Error Stripe al verificar pago {payment_intent_id}: {e}")
            return False

    def procesar_reembolso(
        self,
        payment_intent_id: str,
        monto: Optional[Decimal] = None
    ) -> bool:
        """
        Procesa un reembolso total o parcial vía Stripe.
        """
        try:
            params = {'payment_intent': payment_intent_id}
            if monto:
                params['amount'] = int(monto * 100)

            reembolso = stripe.Refund.create(**params)
            exito = reembolso.status == 'succeeded'

            if exito:
                logger.info(f"Reembolso procesado: {reembolso.id} para PI: {payment_intent_id}")

            return exito

        except stripe.error.StripeError as e:
            logger.error(f"Error Stripe al procesar reembolso: {e}")
            return False

    def procesar_webhook(self, payload: bytes, sig_header: str) -> Optional[Dict[str, Any]]:
        """
        Valida y procesa eventos del webhook de Stripe.

        Args:
            payload: Cuerpo raw del request de Stripe
            sig_header: Header Stripe-Signature

        Returns:
            Dict del evento si es válido, None si falla
        """
        try:
            evento = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            logger.info(f"Webhook Stripe recibido: {evento['type']}")
            return evento

        except ValueError as e:
            logger.error(f"Payload inválido en webhook: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Firma inválida en webhook: {e}")
            return None
