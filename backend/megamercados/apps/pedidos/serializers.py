"""MegaMercados - Serializadores de Pedidos"""
from rest_framework import serializers
from .models import Pedido, DetallePedido
from megamercados.apps.productos.serializers import ProductoSerializer

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_imagen = serializers.SerializerMethodField()
    class Meta:
        model = DetallePedido
        fields = ['id', 'producto', 'producto_nombre', 'producto_imagen', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal', 'precio_unitario']
    def get_producto_imagen(self, obj):
        request = self.context.get('request')
        if obj.producto.imagen and request:
            return request.build_absolute_uri(obj.producto.imagen.url)
        return None

class CrearDetallePedidoSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre_completo')
    class Meta:
        model = Pedido
        fields = ['id', 'usuario', 'usuario_nombre', 'estado', 'subtotal', 
                  'descuento_porcentaje', 'descuento_monto', 'total',
                  'stripe_payment_intent_id', 'notas', 'detalles', 'fecha_pedido']
        read_only_fields = ['usuario', 'subtotal', 'descuento_porcentaje', 'descuento_monto', 'total', 'stripe_payment_intent_id']

class CrearPedidoSerializer(serializers.Serializer):
    items = CrearDetallePedidoSerializer(many=True)
    notas = serializers.CharField(required=False, allow_blank=True)
