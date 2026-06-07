/**
 * MegaMercados - Constantes Globales del Frontend
 * Centraliza todos los valores constantes de la aplicación
 */

// ─── Roles de usuario ─────────────────────────────────────────────────────────
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  MAYORISTA:     'MAYORISTA',
  MINORISTA:     'MINORISTA',
  INVITADO:      'INVITADO',
};

// ─── Estados de pedido ────────────────────────────────────────────────────────
export const ESTADOS_PEDIDO = {
  PENDIENTE:   'PENDIENTE',
  PAGADO:      'PAGADO',
  PROCESANDO:  'PROCESANDO',
  ENVIADO:     'ENVIADO',
  ENTREGADO:   'ENTREGADO',
  CANCELADO:   'CANCELADO',
  REEMBOLSADO: 'REEMBOLSADO',
};

// ─── Configuración de estilos por estado ─────────────────────────────────────
export const ESTADO_ESTILOS = {
  PENDIENTE:   { color: 'bg-yellow-100 text-yellow-700', icono: '⏳' },
  PAGADO:      { color: 'bg-green-100  text-green-700',  icono: '✅' },
  PROCESANDO:  { color: 'bg-blue-100   text-blue-700',   icono: '⚙️' },
  ENVIADO:     { color: 'bg-purple-100 text-purple-700', icono: '🚚' },
  ENTREGADO:   { color: 'bg-gray-100   text-gray-700',   icono: '📦' },
  CANCELADO:   { color: 'bg-red-100    text-red-700',    icono: '❌' },
  REEMBOLSADO: { color: 'bg-orange-100 text-orange-700', icono: '↩️' },
};

// ─── Reglas de negocio (espejo del backend para cálculo optimista) ────────────
export const REGLAS_DESCUENTO = {
  MINORISTA: { umbral: 200,   porcentaje: 10 },
  MAYORISTA: { umbral: 1000,  porcentaje: 15 },
};

// ─── Rutas de la aplicación ───────────────────────────────────────────────────
export const RUTAS = {
  LOGIN:             '/login',
  REGISTRO:          '/registro',
  RECUPERAR:         '/recuperar-contrasena',
  DASHBOARD:         '/dashboard',
  PRODUCTOS:         '/dashboard/productos',
  MIS_PEDIDOS:       '/dashboard/mis-pedidos',
  USUARIOS:          '/dashboard/usuarios',
  REPORTES:          '/dashboard/reportes',
  PERFIL:            '/dashboard/perfil',
};

// ─── Configuración de paginación ─────────────────────────────────────────────
export const PAGE_SIZE = 20;

// ─── Mensajes de error estándar ───────────────────────────────────────────────
export const MENSAJES = {
  ERROR_RED:        'Error de conexión. Verifica tu internet.',
  ERROR_SERVIDOR:   'Error interno del servidor. Intenta más tarde.',
  SIN_PERMISOS:     'No tienes permisos para realizar esta acción.',
  SESION_EXPIRADA:  'Tu sesión ha expirado. Inicia sesión nuevamente.',
  STOCK_INSUFICIENTE: (nombre) => `Stock insuficiente para "${nombre}".`,
};
