/**
 * MegaMercados - Utilidades de Formato
 * Principio SRP: responsabilidad única de formateo de datos
 */

/**
 * Formatea un número como precio en Quetzales.
 * @param {number|string} valor - Valor numérico a formatear
 * @returns {string} Precio formateado, ej. "Q 1,250.00"
 */
export const formatPrecio = (valor) => {
  const num = parseFloat(valor) || 0;
  return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formatea una fecha ISO como fecha legible en español (Guatemala).
 * @param {string} fechaISO - Fecha en formato ISO 8601
 * @param {Object} opciones - Opciones de Intl.DateTimeFormat
 * @returns {string} Fecha formateada
 */
export const formatFecha = (fechaISO, opciones = {}) => {
  if (!fechaISO) return '—';
  const defaults = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(fechaISO).toLocaleDateString('es-GT', { ...defaults, ...opciones });
};

/**
 * Formatea una fecha ISO con hora.
 * @param {string} fechaISO
 * @returns {string}
 */
export const formatFechaHora = (fechaISO) => {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Calcula el descuento aplicable según el rol y el subtotal.
 * Reglas de negocio:
 *  - Minorista > Q200  → 10%
 *  - Mayorista > Q1000 → 15%
 *
 * @param {string} rol      - Rol del usuario ('MINORISTA' | 'MAYORISTA')
 * @param {number} subtotal - Monto base antes de descuento
 * @returns {{ porcentaje: number, monto: number }}
 */
export const calcularDescuento = (rol, subtotal) => {
  const sub = parseFloat(subtotal) || 0;
  if (rol === 'MINORISTA' && sub > 200)  return { porcentaje: 10, monto: +(sub * 0.10).toFixed(2) };
  if (rol === 'MAYORISTA' && sub > 1000) return { porcentaje: 15, monto: +(sub * 0.15).toFixed(2) };
  return { porcentaje: 0, monto: 0 };
};

/**
 * Trunca un texto a un máximo de caracteres añadiendo "…".
 * @param {string} texto
 * @param {number} max
 * @returns {string}
 */
export const truncar = (texto, max = 80) => {
  if (!texto) return '';
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
};

/**
 * Convierte un objeto de errores de DRF a un array de mensajes legibles.
 * @param {Object} errores - Objeto de errores { campo: ['mensaje'] }
 * @returns {string[]}
 */
export const parsearErrores = (errores) => {
  if (!errores || typeof errores !== 'object') return [];
  return Object.entries(errores).flatMap(([campo, msgs]) => {
    const lista = Array.isArray(msgs) ? msgs : [msgs];
    return lista.map(m => campo === 'non_field_errors' ? m : `${campo}: ${m}`);
  });
};
