"""MegaMercados - Serializadores de Productos"""
from rest_framework import serializers
from .models import Producto, Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    total_productos = serializers.SerializerMethodField()
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen', 'activo', 'total_productos']
    def get_total_productos(self, obj):
        return obj.productos.filter(activo=True).count()

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    tiene_stock = serializers.ReadOnlyField()
    imagen_url = serializers.SerializerMethodField()
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'codigo', 'precio', 'stock',
                  'imagen_url', 'categoria', 'categoria_nombre', 'destacado', 'tiene_stock']
    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen and request:
            return request.build_absolute_uri(obj.imagen.url)
        return None

class ProductoAdminSerializer(ProductoSerializer):
    """Serializador extendido para administradores."""
    class Meta(ProductoSerializer.Meta):
        fields = ProductoSerializer.Meta.fields + ['stock_minimo', 'stock_bajo', 'fecha_creacion', 'fecha_actualizacion']
    stock_bajo = serializers.ReadOnlyField()
