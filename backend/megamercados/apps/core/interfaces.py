"""
MegaMercados - Interfaces del Core
Principio SOLID: Inversión de Dependencia (DIP) e Inversión de Interfaces (ISP)
Todas las interfaces definen contratos que las implementaciones deben cumplir.
"""
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Optional, Dict, Any, List


# ─── Interfaz de Autenticación ────────────────────────────────────────────────
class IAutenticacionServicio(ABC):
    """
    Interfaz para el servicio de autenticación.
    Principio ISP: contrato específico para operaciones de autenticación.
    Principio DIP: los módulos de alto nivel dependen de esta abstracción.
    """

    @abstractmethod
    def autenticar(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Autentica un usuario con sus credenciales.

        Args:
            username: Nombre de usuario o email
            password: Contraseña en texto plano

        Returns:
            Dict con tokens JWT y datos del usuario, o None si falla
        """
        pass

    @abstractmethod
    def cerrar_sesion(self, refresh_token: str) -> bool:
        """
        Cierra la sesión invalidando el refresh token.

        Args:
            refresh_token: Token de actualización a invalidar

        Returns:
            True si se cerró correctamente
        """
        pass

    @abstractmethod
    def refrescar_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """
        Genera un nuevo access token usando el refresh token.

        Args:
            refresh_token: Token de actualización válido

        Returns:
            Dict con nuevo access_token, o None si falla
        """
        pass

    @abstractmethod
    def recuperar_contrasena(self, email: str) -> bool:
        """
        Envía un correo de recuperación de contraseña.

        Args:
            email: Correo electrónico del usuario

        Returns:
            True si se envió correctamente
        """
        pass


# ─── Interfaz de Descuentos ───────────────────────────────────────────────────
class IDescuentoEstrategia(ABC):
    """
    Interfaz para estrategias de descuento.
    Principio OCP: nuevas estrategias de descuento sin modificar código existente.
    Principio LSP: cualquier implementación puede sustituirse por otra.
    """

    @abstractmethod
    def calcular_descuento(self, subtotal: Decimal) -> Decimal:
        """
        Calcula el monto del descuento aplicable.

        Args:
            subtotal: Monto base antes de descuentos

        Returns:
            Monto del descuento a aplicar
        """
        pass

    @abstractmethod
    def es_aplicable(self, subtotal: Decimal) -> bool:
        """
        Determina si el descuento aplica para el subtotal dado.

        Args:
            subtotal: Monto a verificar

        Returns:
            True si el descuento es aplicable
        """
        pass


# ─── Interfaz de Pagos ────────────────────────────────────────────────────────
class IPagoServicio(ABC):
    """
    Interfaz para procesamiento de pagos.
    Principio ISP: contrato específico para operaciones de pago.
    """

    @abstractmethod
    def crear_intento_pago(
        self,
        monto: Decimal,
        moneda: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crea un intento de pago en el proveedor externo.

        Args:
            monto: Monto a cobrar
            moneda: Código de moneda (GTQ, USD, etc.)
            metadata: Datos adicionales del pedido

        Returns:
            Dict con client_secret y payment_intent_id
        """
        pass

    @abstractmethod
    def confirmar_pago(self, payment_intent_id: str) -> bool:
        """
        Confirma que un pago fue procesado exitosamente.

        Args:
            payment_intent_id: ID del intento de pago en Stripe

        Returns:
            True si el pago fue confirmado
        """
        pass

    @abstractmethod
    def procesar_reembolso(self, payment_intent_id: str, monto: Optional[Decimal] = None) -> bool:
        """
        Procesa un reembolso total o parcial.

        Args:
            payment_intent_id: ID del intento de pago original
            monto: Monto a reembolsar (None = reembolso total)

        Returns:
            True si el reembolso fue procesado
        """
        pass


# ─── Interfaz de Inventario ───────────────────────────────────────────────────
class IInventarioServicio(ABC):
    """
    Interfaz para gestión de inventario.
    Principio SRP: responsabilidad única de gestión de stock.
    """

    @abstractmethod
    def verificar_stock(self, producto_id: int, cantidad: int) -> bool:
        """
        Verifica si hay suficiente stock disponible.

        Args:
            producto_id: ID del producto
            cantidad: Cantidad requerida

        Returns:
            True si hay stock disponible
        """
        pass

    @abstractmethod
    def reducir_stock(self, producto_id: int, cantidad: int) -> bool:
        """
        Reduce el stock del producto tras una venta.

        Args:
            producto_id: ID del producto
            cantidad: Cantidad vendida

        Returns:
            True si se actualizó correctamente
        """
        pass

    @abstractmethod
    def restaurar_stock(self, producto_id: int, cantidad: int) -> bool:
        """
        Restaura el stock en caso de cancelación o reembolso.

        Args:
            producto_id: ID del producto
            cantidad: Cantidad a restaurar

        Returns:
            True si se restauró correctamente
        """
        pass


# ─── Interfaz de Notificaciones ───────────────────────────────────────────────
class INotificacionServicio(ABC):
    """
    Interfaz para envío de notificaciones.
    Principio ISP: contrato mínimo necesario para notificaciones.
    """

    @abstractmethod
    def enviar_confirmacion_pedido(self, pedido_id: int, email: str) -> bool:
        """Envía confirmación de pedido al cliente."""
        pass

    @abstractmethod
    def enviar_recuperacion_contrasena(self, email: str, token: str) -> bool:
        """Envía enlace de recuperación de contraseña."""
        pass
