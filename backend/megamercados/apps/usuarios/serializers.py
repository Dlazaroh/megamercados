"""
MegaMercados - Serializadores de Usuarios
Principio SRP: responsabilidad única de serialización/validación de datos
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Usuario, RolUsuario


class RegistroSerializer(serializers.ModelSerializer):
    """Serializador para registro de nuevos usuarios."""

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=Usuario.objects.all(),
            message='Este correo electrónico ya está registrado.'
        )]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Usuario
        fields = [
            'email', 'password', 'password_confirm',
            'nombre', 'apellido', 'telefono', 'direccion', 'nit', 'rol'
        ]
        extra_kwargs = {
            'rol': {'default': RolUsuario.MINORISTA},
        }

    def validate(self, attrs):
        """Valida que las contraseñas coincidan."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs

    def create(self, validated_data):
        """Crea el usuario con contraseña encriptada."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        usuario = Usuario.objects.create_user(password=password, **validated_data)
        return usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializador completo del usuario (solo lectura de campos sensibles)."""

    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre', 'apellido', 'nombre_completo',
            'telefono', 'direccion', 'nit', 'rol',
            'is_active', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'email', 'fecha_creacion']


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    """Serializador para actualización del perfil del usuario."""

    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'telefono', 'direccion', 'nit']


class CambioContrasenaSerializer(serializers.Serializer):
    """Serializador para cambio de contraseña autenticado."""

    password_actual = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    password_nuevo = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['password_nuevo'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas nuevas no coinciden.'
            })
        return attrs


class RecuperarContrasenaSerializer(serializers.Serializer):
    """Serializador para solicitud de recuperación de contraseña."""

    email = serializers.EmailField(required=True)


class ResetContrasenaSerializer(serializers.Serializer):
    """Serializador para reset de contraseña con token."""

    token = serializers.CharField(required=True)
    password_nuevo = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['password_nuevo'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs
