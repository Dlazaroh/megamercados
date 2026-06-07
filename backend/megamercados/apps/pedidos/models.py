"""
MegaMercados - Modelos de Pedidos
Principio SRP: gestión exclusiva de pedidos y sus detalles
Implementa las reglas de negocio de descuentos por tipo de cliente
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from megamercados.apps.usuarios.models import Usuario, RolUsuario
from megamercados.apps.productos.models import Producto


class EstadoPedido(models.TextChoices):
    """Estados del ciclo de vida de un pedido."""
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    PAGADO = 'PAGADO', 'Pagado'
    PROCESANDO = 'PROCESANDO', 'Procesando'
    ENVIADO = 'ENVIADO', 'Enviado'
    ENTREGADO = 'ENTREGADO', 'Entregado'
    CANCELADO = 'CANCELADO', 'Cancelado'
    REEMBOLSADO = 'REEMBOLSADO', 'Reembolsado'


class Pedido(models.Model):
    """
    Registro de compra general.
    Almacena fecha, estado, total y referencia al usuario.
    Aplica descuentos según las reglas de negocio por tipo de cliente.
    """

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='pedidos',
        verbose_name='Cliente'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoPedido.choices,
        default=EstadoPedido.PENDIENTE,
        verbose_name='Estado'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Subtotal (Q)'
    )
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento (%)'
    )
    descuento_monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento (Q)'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total (Q)'
    )
    stripe_payment_intent_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Stripe Payment Intent ID'
    )
    stripe_client_secret = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Stripe Client Secret'
    )
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas'
    )
    fecha_pedido = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha del Pedido'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        db_table = 'pedidos'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_pedido']
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['fecha_pedido']),
        ]

    def __str__(self) -> str:
        return f"Pedido #{self.id} - {self.usuario.nombre_completo} - Q{self.total}"

    def calcular_totales(self) -> None:
        """
        Calcula subtotal, descuento y total aplicando reglas de negocio.

        Reglas de negocio:
        - Minorista: 10% descuento en compras > Q200.00
        - Mayorista: 15% descuento en compras > Q1,000.00
        """
        # Calcular subtotal sumando detalles
        subtotal = sum(
            detalle.subtotal for detalle in self.detalles.all()
        )
        self.subtotal = subtotal

        # Aplicar descuentos según rol y umbrales
        descuento_pct = Decimal('0')

        if self.usuario.es_minorista:
            umbral = Decimal(str(settings.DESCUENTO_MINORISTA_UMBRAL))
            pct = Decimal(str(settings.DESCUENTO_MINORISTA_PORCENTAJE))
            if subtotal > umbral:
                descuento_pct = pct

        elif self.usuario.es_mayorista:
            umbral = Decimal(str(settings.DESCUENTO_MAYORISTA_UMBRAL))
            pct = Decimal(str(settings.DESCUENTO_MAYORISTA_PORCENTAJE))
            if subtotal > umbral:
                descuento_pct = pct

        self.descuento_porcentaje = descuento_pct
        self.descuento_monto = (subtotal * descuento_pct / Decimal('100')).quantize(Decimal('0.01'))
        self.total = (subtotal - self.descuento_monto).quantize(Decimal('0.01'))

        self.save(update_fields=['subtotal', 'descuento_porcentaje', 'descuento_monto', 'total'])


class DetallePedido(models.Model):
    """
    Enlace entre un pedido y los productos comprados.
    Almacena cantidad y precio en el momento de la venta (snapshot).
    """

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Pedido'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='detalles_pedido',
        verbose_name='Producto'
    )
    cantidad = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio Unitario (Q al momento de compra)'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Subtotal (Q)'
    )

    class Meta:
        db_table = 'detalle_pedidos'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedidos'

    def save(self, *args, **kwargs):
        """Calcula automáticamente el subtotal antes de guardar."""
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.cantidad}x {self.producto.nombre} @ Q{self.precio_unitario}"
