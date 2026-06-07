"""MegaMercados - Admin de Productos"""
from django.contrib import admin
from .models import Producto, Categoria


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'categoria', 'precio', 'stock', 'stock_bajo', 'activo', 'destacado']
    list_filter = ['categoria', 'activo', 'destacado']
    search_fields = ['nombre', 'codigo', 'descripcion']
    list_editable = ['precio', 'stock', 'activo', 'destacado']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    ordering = ['nombre']

    @admin.display(boolean=True, description='Stock Bajo')
    def stock_bajo(self, obj):
        return obj.stock_bajo
