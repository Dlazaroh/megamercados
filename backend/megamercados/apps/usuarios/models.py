"""
MegaMercados - Modelo de Usuarios
Principio SRP: gestiona únicamente los datos y estado del usuario
Principio OCP: extensible con nuevos roles sin modificar la clase base
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class RolUsuario(models.TextChoices):
    """Roles disponibles en el sistema MegaMercados."""
    ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'
    MAYORISTA = 'MAYORISTA', 'Mayorista'
    MINORISTA = 'MINORISTA', 'Minorista'
    INVITADO = 'INVITADO', 'Invitado'


class UsuarioManager(BaseUserManager):
    """
    Manager personalizado para el modelo Usuario.
    Principio SRP: responsabilidad única de creación de usuarios.
    """

    def create_user(self, email: str, password: str = None, **extra_fields):
        """Crea y guarda un usuario regular con email y contraseña."""
        if not email:
            raise ValueError('El email es obligatorio.')
        email = self.normalize_email(email)
        extra_fields.setdefault('rol', RolUsuario.MINORISTA)
        extra_fields.setdefault('is_active', True)
        usuario = self.model(email=email, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email: str, password: str, **extra_fields):
        """Crea y guarda un superusuario administrador."""
        extra_fields.setdefault('rol', RolUsuario.ADMINISTRADOR)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

    def mayoristas(self):
        """Retorna queryset de clientes mayoristas."""
        return self.get_queryset().filter(rol=RolUsuario.MAYORISTA, is_active=True)

    def minoristas(self):
        """Retorna queryset de clientes minoristas."""
        return self.get_queryset().filter(rol=RolUsuario.MINORISTA, is_active=True)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario extendido para MegaMercados.
    Soporta roles: Administrador, Mayorista, Minorista, Invitado.
    """

    email = models.EmailField(
        unique=True,
        verbose_name='Correo Electrónico'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    apellido = models.CharField(
        max_length=100,
        verbose_name='Apellido'
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )
    direccion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Dirección'
    )
    nit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='NIT'
    )
    rol = models.CharField(
        max_length=20,
        choices=RolUsuario.choices,
        default=RolUsuario.MINORISTA,
        verbose_name='Rol'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Es Staff'
    )
    fecha_creacion = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de Registro'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-fecha_creacion']

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellido} ({self.email})"

    @property
    def nombre_completo(self) -> str:
        """Retorna el nombre completo del usuario."""
        return f"{self.nombre} {self.apellido}"

    @property
    def es_administrador(self) -> bool:
        """Verifica si el usuario es administrador."""
        return self.rol == RolUsuario.ADMINISTRADOR

    @property
    def es_mayorista(self) -> bool:
        """Verifica si el usuario es mayorista."""
        return self.rol == RolUsuario.MAYORISTA

    @property
    def es_minorista(self) -> bool:
        """Verifica si el usuario es minorista."""
        return self.rol == RolUsuario.MINORISTA
