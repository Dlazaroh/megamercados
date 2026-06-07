"""MegaMercados - URLs de Autenticación"""
from django.urls import path
from ..views_auth import (
    LoginView, LogoutView, RefrescarTokenView,
    RegistroView, RecuperarContrasenaView, ResetContrasenaView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('refresh/', RefrescarTokenView.as_view(), name='auth-refresh'),
    path('registro/', RegistroView.as_view(), name='auth-registro'),
    path('recuperar-contrasena/', RecuperarContrasenaView.as_view(), name='auth-recuperar'),
    path('reset-contrasena/', ResetContrasenaView.as_view(), name='auth-reset'),
]
