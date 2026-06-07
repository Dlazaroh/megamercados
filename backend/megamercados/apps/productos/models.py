"""
MegaMercados - Modelos de Productos y Categorías
Principio SRP: cada modelo gestiona sus propios datos
Principio OCP: extensible con nuevas categorías y atributos
"""
from django.db import models
from django.core.validators import MinValueValidator


class Categoria(models.Model):
    """
    Clasificación jerárquica de los productos del catálogo.
    """

    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    imagen = models.ImageField(
        upload_to='categorias/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    class Meta:
        db_table = 'categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def __str__(self) -> str:
        return self.nombre


class Producto(models.Model):
    """
    Producto del catálogo de MegaMercados.
    Contiene inventario, precios y stock disponible.
    """

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Categoría'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Producto'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código'
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name='Precio (Q)'
    )
    stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Stock Disponible'
    )
    stock_minimo = models.PositiveIntegerField(
        default=5,
        verbose_name='Stock Mínimo (Alerta)'
    )
    imagen = models.ImageField(
        upload_to='productos/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    destacado = models.BooleanField(
        default=False,
        verbose_name='Producto Destacado'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['categoria', 'activo']),
        ]

    def __str__(self) -> str:
        return f"{self.nombre} (Q{self.precio})"

    @property
    def tiene_stock(self) -> bool:
        """Indica si hay stock disponible."""
        return self.stock > 0

    @property
    def stock_bajo(self) -> bool:
        """Indica si el stock está por debajo del mínimo."""
        return self.stock <= self.stock_minimo

    def reducir_stock(self, cantidad: int) -> bool:
        """
        Reduce el stock de forma segura.
        Retorna False si no hay stock suficiente.
        """
        if self.stock < cantidad:
            return False
        self.stock -= cantidad
        self.save(update_fields=['stock'])
        return True

    def restaurar_stock(self, cantidad: int) -> None:
        """Restaura el stock (por cancelaciones o reembolsos)."""
        self.stock += cantidad
        self.save(update_fields=['stock'])
