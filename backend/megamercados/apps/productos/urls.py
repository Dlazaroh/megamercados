"""MegaMercados - URLs de Productos"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, CategoriaViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'', ProductoViewSet, basename='productos')

urlpatterns = [path('', include(router.urls))]
