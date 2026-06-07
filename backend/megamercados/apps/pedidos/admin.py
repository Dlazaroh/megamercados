"""MegaMercados - Admin de Pedidos"""
from django.contrib import admin
from .models import Pedido, DetallePedido


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    readonly_fields = ['subtotal']
    fields = ['producto', 'cantidad', 'precio_unitario', 'subtotal']


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'estado', 'subtotal', 'descuento_porcentaje', 'total', 'fecha_pedido']
    list_filter = ['estado', 'fecha_pedido']
    search_fields = ['usuario__email', 'usuario__nombre']
    readonly_fields = ['subtotal', 'descuento_monto', 'total', 'stripe_payment_intent_id', 'fecha_pedido']
    inlines = [DetallePedidoInline]
    ordering = ['-fecha_pedido']
