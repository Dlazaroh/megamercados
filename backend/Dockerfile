# ─── MegaMercados Backend - Dockerfile ───────────────────────────────────────
# Multi-stage build para imagen optimizada de producción
# Stage 1: Builder - instala dependencias
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Dependencias del sistema para MySQL y Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=megamercados.settings.production \
    PORT=8000

WORKDIR /app

# Solo librerías de runtime (no compiladores)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias instaladas del builder
COPY --from=builder /install /usr/local

# Crear usuario no-root para seguridad
RUN groupadd -r megamercados && useradd -r -g megamercados megamercados \
    && mkdir -p /app/staticfiles /app/media /var/log/megamercados \
    && chown -R megamercados:megamercados /app /var/log/megamercados

# Copiar código fuente
COPY --chown=megamercados:megamercados . .

USER megamercados

# Recopilar archivos estáticos
RUN python manage.py collectstatic --noinput --settings=megamercados.settings.production || true

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/swagger/?format=openapi')" || exit 1

# Entrypoint con gunicorn (WSGI server productivo)
CMD ["gunicorn", \
     "megamercados.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
