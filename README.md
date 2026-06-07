# 🛒 MegaMercados — E-commerce de Supermercado

Sistema de comercio electrónico empresarial para supermercados, construido con arquitectura de 3 capas, patrones de diseño y principios SOLID.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 1: FRONTEND            React.js + Tailwind CSS    │
│  ├── Catálogo de Productos   (Modal de detalle)         │
│  ├── Carrito de Compras      (Sidebar + Stripe)         │
│  ├── Dashboard               (Admin / Cliente)          │
│  ├── Gestión de Usuarios     (Solo Admin)               │
│  └── Reportes                (Recharts)                 │
├─────────────────────────────────────────────────────────┤
│  CAPA 2: BACKEND             Django REST Framework      │
│  ├── API Gateway             (URLs centralizadas)       │
│  ├── Inyección Dependencias  (Interfaces SOLID)         │
│  ├── Autenticación           JWT + OAuth2               │
│  ├── Lógica de Negocio       Descuentos automáticos     │
│  └── Swagger UI              Documentación OpenAPI      │
├─────────────────────────────────────────────────────────┤
│  CAPA 3: BASE DE DATOS       MySQL 8                    │
│  ├── usuarios                (roles: Admin/May/Min/Inv) │
│  ├── categorias              (catálogo)                 │
│  ├── productos               (inventario + precios)     │
│  ├── pedidos                 (estado + totales)         │
│  └── detalle_pedidos         (líneas con snapshot)      │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React.js 18, Tailwind CSS 3, React Router 6, Recharts |
| Backend | Python 3.11, Django 4.2, DRF, drf-yasg (Swagger) |
| Base de Datos | MySQL 8.0 |
| Autenticación | JWT (SimpleJWT) + OAuth2 |
| Pagos | Stripe Express (Payment Intents API) |
| Cache / Broker | Redis 7 |
| Contenedores | Docker + Docker Compose |

---

## 🎯 Principios SOLID Aplicados

| Principio | Implementación |
|-----------|---------------|
| **S** — Responsabilidad Única | Cada clase/módulo tiene una sola responsabilidad |
| **O** — Abierto/Cerrado | `IDescuentoEstrategia`: nuevas estrategias sin modificar código existente |
| **L** — Sustitución Liskov | Todas las implementaciones de interfaces son intercambiables |
| **I** — Segregación de Interfaces | `IAutenticacionServicio`, `IPagoServicio`, `IInventarioServicio` |
| **D** — Inversión de Dependencia | Controladores dependen de abstracciones, no de implementaciones concretas |

---

## 💰 Reglas de Negocio

| Cliente | Umbral | Descuento |
|---------|--------|-----------|
| **Minorista** | Compras > Q200.00 | 10% |
| **Mayorista** | Compras > Q1,000.00 | 15% |

---

## 👥 Roles de Usuario

| Rol | Acceso |
|-----|--------|
| **Administrador** | CRUD productos, gestión usuarios, reportes completos |
| **Mayorista** | Compras con descuento 15% en pedidos > Q1,000 |
| **Minorista** | Compras con descuento 10% en pedidos > Q200 |
| **Invitado** | Solo lectura del catálogo |

---

## 🗂️ Estructura del Proyecto

```
megamercados/
├── backend/
│   ├── megamercados/
│   │   ├── apps/
│   │   │   ├── core/           # Interfaces SOLID, Excepciones, Permisos
│   │   │   ├── usuarios/       # Modelo Usuario, Auth Service, JWT
│   │   │   ├── productos/      # Catálogo, Inventario, Admin
│   │   │   ├── pedidos/        # Pedidos, Descuentos, Reglas de negocio
│   │   │   └── pagos/          # Stripe Express, Webhooks
│   │   ├── settings/
│   │   │   ├── base.py         # Configuración compartida
│   │   │   ├── development.py  # Desarrollo local
│   │   │   └── production.py   # Producción / Docker / Render
│   │   └── urls.py             # API Gateway centralizado
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # auth, layout, dashboard, productos...
│   │   ├── context/            # AuthContext, CarritoContext
│   │   ├── hooks/              # useProductos, usePedidos
│   │   ├── services/api.js     # Cliente API Gateway (Axios + JWT)
│   │   └── utils/              # formatters, validators, constants
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   └── schema.sql              # DDL MySQL completo + Vistas SQL
├── docker-compose.yml
└── README.md
```

---

## 🖥️ Opción 1 — Desarrollo en Localhost (sin Docker)

Ideal para desarrollo activo y debugging. Requiere MySQL y Redis instalados localmente.

### Requisitos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Python | 3.11+ | https://python.org |
| Node.js | 18 LTS+ | https://nodejs.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Redis | 7+ | https://redis.io/download (Linux/Mac) o https://github.com/microsoftarchive/redis/releases (Windows) |


### Paso 2 — Configurar el Backend Django

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/megamercados.git
cd megamercados/backend

# Crear y activar entorno virtual
python -m venv .venv
source .venv/bin/activate          # Linux / macOS
# .venv\Scripts\activate           # Windows (PowerShell)

# Instalar dependencias
pip install -r requirements.txt

# Copiar y editar variables de entorno
cp .env.example .env
```

Edita `backend/.env` con los valores de desarrollo local:

```env
DEBUG=True

# Base de datos local
DB_NAME=megamercados_db
DB_USER=megamercados_user
DB_PASSWORD=MiPassword123!
DB_HOST=localhost
DB_PORT=3306

# Redis local
REDIS_URL=redis://127.0.0.1:6379/0

# CORS — permite el frontend de desarrollo
CORS_ALLOWED_ORIGINS=http://localhost:3000

# URL del frontend para emails de recuperación
FRONTEND_URL=http://localhost:3000
```

```bash
# Aplicar migraciones y crear superusuario
export DJANGO_SETTINGS_MODULE=megamercados.settings.development

python manage.py migrate
python manage.py createsuperuser
# → Ingresa email, nombre, apellido y contraseña cuando se soliciten

# Iniciar el servidor de desarrollo
python manage.py runserver
# Escucha en http://localhost:8000
```

### Paso 3 — Configurar el Frontend React

Abre una nueva terminal:

```bash
cd megamercados/frontend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno local

# Iniciar servidor de desarrollo
npm start
# Abre automáticamente http://localhost:3000
```

### URLs en Localhost

| Servicio | URL |
|----------|-----|
| Frontend React | http://localhost:3000 |
| Backend Django | http://localhost:8000 |
| Swagger UI | http://localhost:8000/swagger/ |
| ReDoc | http://localhost:8000/redoc/ |
| Admin Django | http://localhost:8000/admin/ |
| Stripe Webhook (local) | usar `stripe listen` (ver abajo) |

### Configurar Stripe Webhook en local (opcional)

```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:8000/api/v1/pagos/webhook/
# Copia el webhook secret que imprime y ponlo en STRIPE_WEBHOOK_SECRET del .env
```

---

## 🐳 Opción 2 — Despliegue con Docker (recomendado)

Levanta todos los servicios (MySQL, Redis, Django, React/Nginx) con un solo comando. Ideal para staging y producción on-premise.

### Requisitos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Docker Engine | 24.0+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.20+ | incluido en Docker Desktop |

### Paso 1 — Clonar y configurar variables

```bash
git clone https://github.com/tu-usuario/megamercados.git
cd megamercados

cp backend/.env.example backend/.env
```

Edita `backend/.env` para producción Docker:

```env
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL — el host es el nombre del servicio en docker-compose
DB_NAME=megamercados_db
DB_USER=megamercados_user
DB_PASSWORD=SuperPassword456!
DB_HOST=db
DB_PORT=3306

# Redis — el host es el nombre del servicio en docker-compose
REDIS_URL=redis://redis:6379/0

# Stripe

# CORS — permite el frontend servido por Nginx


# URL del frontend
FRONTEND_URL=http://localhost
```

### Paso 2 — Construir e iniciar todos los servicios

```bash
# Construir imágenes y levantar en segundo plano
docker-compose up -d --build

# Verificar que todos los contenedores estén corriendo
docker-compose ps
```

Salida esperada:

```
NAME                      STATUS          PORTS
megamercados_db           running (healthy)   0.0.0.0:3306->3306/tcp
megamercados_redis        running (healthy)   0.0.0.0:6379->6379/tcp
megamercados_backend      running (healthy)   0.0.0.0:8000->8000/tcp
megamercados_frontend     running (healthy)   0.0.0.0:80->80/tcp
```

### Paso 3 — Inicializar datos

```bash
# Las migraciones se aplican automáticamente al iniciar el backend.
# Solo necesitas crear el superusuario:
docker-compose exec backend python manage.py createsuperuser
```

### Paso 4 — Verificar el despliegue

```bash
# Ver logs en tiempo real de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Verificar salud del backend
curl http://localhost:8000/swagger/?format=openapi
```

### URLs en Docker

| Servicio | URL |
|----------|-----|
| Frontend React (Nginx) | http://localhost |
| Backend Django (Gunicorn) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/swagger/ |
| ReDoc | http://localhost:8000/redoc/ |
| Admin Django | http://localhost:8000/admin/ |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

### Comandos útiles de Docker

```bash
# Detener todos los servicios (preserva los datos)
docker-compose stop

# Detener y eliminar contenedores (preserva los volúmenes con datos)
docker-compose down

# Eliminar TODO incluyendo datos (base de datos, media, cache)
docker-compose down -v

# Reconstruir solo el backend tras cambios de código
docker-compose up -d --build backend

# Ejecutar comandos Django dentro del contenedor
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py collectstatic --noinput

# Ver uso de recursos
docker stats
```

---


## 📚 Documentación de la API

Accede a **Swagger UI** en: `http://localhost:8000/swagger/`

### Endpoints principales

#### Autenticación
```
POST /api/v1/auth/login/                → Obtener tokens JWT
POST /api/v1/auth/logout/               → Invalidar refresh token
POST /api/v1/auth/refresh/              → Renovar access token
POST /api/v1/auth/registro/             → Crear cuenta nueva
POST /api/v1/auth/recuperar-contrasena/ → Enviar email de recuperación
POST /api/v1/auth/reset-contrasena/     → Restablecer con token
```

#### Catálogo
```
GET    /api/v1/productos/                        → Listar con filtros y paginación
GET    /api/v1/productos/{id}/                   → Detalle de producto
POST   /api/v1/productos/                        → Crear producto (Admin)
PATCH  /api/v1/productos/{id}/                   → Actualizar producto (Admin)
PATCH  /api/v1/productos/{id}/actualizar_precio/ → Cambiar precio (Admin)
GET    /api/v1/productos/destacados/             → Productos destacados
GET    /api/v1/productos/categorias/             → Listar categorías
```

#### Pedidos
```
GET  /api/v1/pedidos/                       → Listar pedidos del usuario
POST /api/v1/pedidos/crear_pedido/          → Crear pedido + Stripe Payment Intent
POST /api/v1/pedidos/{id}/confirmar_pago/   → Confirmar pago y actualizar stock
```

#### Usuarios (Admin)
```
GET   /api/v1/usuarios/                  → Listar todos los usuarios (Admin)
GET   /api/v1/usuarios/perfil/           → Perfil del usuario autenticado
PATCH /api/v1/usuarios/actualizar_perfil/ → Actualizar perfil propio
POST  /api/v1/usuarios/cambiar_contrasena/ → Cambiar contraseña
```

#### Pagos
```
POST /api/v1/pagos/webhook/ → Webhook de Stripe (uso interno)
```

---

## 🔐 Seguridad

- **JWT** con refresh token rotation y blacklist en logout
- **OAuth2** Password Flow con scopes por rol
- Contraseñas hasheadas con **bcrypt** (via Django `set_password`)
- **CORS** estricto configurado por dominio en producción
- Headers de seguridad: `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`
- Usuario non-root en contenedor Docker
- Variables sensibles únicamente en `.env` (nunca en código fuente)
- Rutas protegidas en el frontend por rol de usuario

---

## 📋 Licencia

© 2025 MegaMercados. Todos los derechos reservados.
