-- ============================================================
-- MegaMercados - Esquema Relacional MySQL
-- Arquitectura 3 Capas: Base de Datos Relacional
-- Generado automáticamente por Django Migrations
-- ============================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS megamercados_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE megamercados_db;

-- ─── Tabla: usuarios ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email           VARCHAR(254)    NOT NULL UNIQUE,
    password        VARCHAR(128)    NOT NULL,                    -- bcrypt hash
    nombre          VARCHAR(100)    NOT NULL,
    apellido        VARCHAR(100)    NOT NULL,
    telefono        VARCHAR(20)         NULL,
    direccion       TEXT                NULL,
    nit             VARCHAR(20)         NULL,
    rol             ENUM('ADMINISTRADOR','MAYORISTA','MINORISTA','INVITADO')
                                    NOT NULL DEFAULT 'MINORISTA',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    is_staff        TINYINT(1)      NOT NULL DEFAULT 0,
    is_superuser    TINYINT(1)      NOT NULL DEFAULT 0,
    last_login      DATETIME            NULL,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_usuarios_email  (email),
    INDEX idx_usuarios_rol    (rol),
    INDEX idx_usuarios_activo (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Clientes y administradores del sistema MegaMercados';

-- ─── Tabla: categorias ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL UNIQUE,
    descripcion     TEXT                NULL,
    imagen          VARCHAR(255)        NULL,                    -- ruta relativa
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_categorias_nombre (nombre),
    INDEX idx_categorias_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Clasificación del catálogo de productos';

-- ─── Tabla: productos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria_id    BIGINT UNSIGNED NOT NULL,
    nombre          VARCHAR(200)    NOT NULL,
    descripcion     TEXT                NULL,
    codigo          VARCHAR(50)     NOT NULL UNIQUE,             -- código SKU
    precio          DECIMAL(10,2)   NOT NULL,                    -- en Quetzales (GTQ)
    stock           INT UNSIGNED    NOT NULL DEFAULT 0,
    stock_minimo    INT UNSIGNED    NOT NULL DEFAULT 5,          -- umbral de alerta
    imagen          VARCHAR(255)        NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    destacado       TINYINT(1)      NOT NULL DEFAULT 0,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_productos_codigo    (codigo),
    INDEX idx_productos_cat_activo (categoria_id, activo),
    INDEX idx_productos_destacado (destacado),
    FULLTEXT idx_productos_busqueda (nombre, descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Inventario, precios y stock del catálogo';

-- ─── Tabla: pedidos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
    id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id                  BIGINT UNSIGNED NOT NULL,
    estado                      ENUM('PENDIENTE','PAGADO','PROCESANDO',
                                     'ENVIADO','ENTREGADO','CANCELADO','REEMBOLSADO')
                                                NOT NULL DEFAULT 'PENDIENTE',
    -- Montos en Quetzales (GTQ)
    subtotal                    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    descuento_porcentaje        DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
    descuento_monto             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total                       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    -- Reglas de negocio aplicadas:
    -- Minorista  > Q200.00   → descuento 10%
    -- Mayorista  > Q1,000.00 → descuento 15%
    stripe_payment_intent_id    VARCHAR(200)        NULL,
    stripe_client_secret        VARCHAR(500)        NULL,
    notas                       TEXT                NULL,
    fecha_pedido                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_pedidos_usuario_estado (usuario_id, estado),
    INDEX idx_pedidos_fecha          (fecha_pedido),
    INDEX idx_pedidos_estado         (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de compras: fecha, estado, total y usuario';

-- ─── Tabla: detalle_pedidos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id       BIGINT UNSIGNED NOT NULL,
    producto_id     BIGINT UNSIGNED NOT NULL,
    cantidad        INT UNSIGNED    NOT NULL,
    precio_unitario DECIMAL(10,2)   NOT NULL,   -- snapshot: precio al momento de compra
    subtotal        DECIMAL(12,2)   NOT NULL,   -- precio_unitario × cantidad
    PRIMARY KEY (id),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_detalle_pedido   (pedido_id),
    INDEX idx_detalle_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Líneas de detalle: productos, cantidad y precio en el momento de venta';

-- ─── Datos iniciales: Categorías de supermercado ──────────────────────────────
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Frutas y Verduras',   'Productos frescos del campo'),
    ('Lácteos',             'Leche, queso, yogurt y derivados'),
    ('Carnes y Embutidos',  'Carnes frescas, aves y embutidos'),
    ('Panadería',           'Pan fresco, pasteles y repostería'),
    ('Bebidas',             'Jugos, refrescos, agua y bebidas energéticas'),
    ('Limpieza',            'Productos de limpieza para el hogar'),
    ('Higiene Personal',    'Cuidado personal y salud'),
    ('Granos y Cereales',   'Arroz, frijoles, maíz y cereales'),
    ('Enlatados',           'Conservas y productos enlatados'),
    ('Congelados',          'Productos congelados y helados');

-- ─── Usuario administrador inicial ───────────────────────────────────────────
-- NOTA: La contraseña real se crea con Django manage.py createsuperuser
-- Este es solo un placeholder de referencia
INSERT INTO usuarios (email, password, nombre, apellido, rol, is_active, is_staff, is_superuser)
VALUES (
    'admin@megamercados.com',
    'pbkdf2_sha256$...',   -- Usar: python manage.py createsuperuser
    'Administrador',
    'MegaMercados',
    'ADMINISTRADOR',
    1, 1, 1
);

-- ─── Vistas útiles para reportes ─────────────────────────────────────────────

-- Vista: Resumen de ventas por mes
CREATE OR REPLACE VIEW v_ventas_por_mes AS
SELECT
    DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS mes,
    COUNT(p.id)                           AS total_pedidos,
    SUM(p.subtotal)                       AS subtotal_total,
    SUM(p.descuento_monto)                AS descuentos_otorgados,
    SUM(p.total)                          AS ventas_netas
FROM pedidos p
WHERE p.estado IN ('PAGADO', 'ENTREGADO')
GROUP BY DATE_FORMAT(p.fecha_pedido, '%Y-%m')
ORDER BY mes DESC;

-- Vista: Top 10 productos más vendidos
CREATE OR REPLACE VIEW v_top_productos AS
SELECT
    pr.id,
    pr.nombre,
    pr.codigo,
    c.nombre                      AS categoria,
    SUM(dp.cantidad)              AS unidades_vendidas,
    SUM(dp.subtotal)              AS ingresos_generados,
    pr.stock                      AS stock_actual
FROM detalle_pedidos dp
INNER JOIN productos pr  ON pr.id = dp.producto_id
INNER JOIN categorias c  ON c.id  = pr.categoria_id
INNER JOIN pedidos p     ON p.id  = dp.pedido_id
WHERE p.estado IN ('PAGADO', 'ENTREGADO')
GROUP BY pr.id, pr.nombre, pr.codigo, c.nombre, pr.stock
ORDER BY unidades_vendidas DESC
LIMIT 10;

-- Vista: Clientes con mayor gasto
CREATE OR REPLACE VIEW v_top_clientes AS
SELECT
    u.id,
    CONCAT(u.nombre, ' ', u.apellido) AS cliente,
    u.email,
    u.rol,
    COUNT(p.id)                        AS total_pedidos,
    SUM(p.total)                       AS gasto_total
FROM usuarios u
INNER JOIN pedidos p ON p.usuario_id = u.id
WHERE p.estado IN ('PAGADO', 'ENTREGADO')
  AND u.rol IN ('MAYORISTA', 'MINORISTA')
GROUP BY u.id, u.nombre, u.apellido, u.email, u.rol
ORDER BY gasto_total DESC
LIMIT 20;
