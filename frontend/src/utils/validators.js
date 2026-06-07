/**
 * MegaMercados - Utilidades de Validación
 * Principio SRP: responsabilidad única de validación de datos en el frontend
 */

/**
 * Valida que un email tenga formato correcto.
 * @param {string} email
 * @returns {boolean}
 */
export const esEmailValido = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? '');

/**
 * Valida que una contraseña cumpla los requisitos mínimos:
 * mínimo 8 caracteres, al menos una mayúscula y un número.
 * @param {string} password
 * @returns {{ valida: boolean, mensaje: string }}
 */
export const validarPassword = (password) => {
  if (!password || password.length < 8)
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  if (!/[A-Z]/.test(password))
    return { valida: false, mensaje: 'Debe incluir al menos una letra mayúscula.' };
  if (!/[0-9]/.test(password))
    return { valida: false, mensaje: 'Debe incluir al menos un número.' };
  return { valida: true, mensaje: '' };
};

/**
 * Valida que un NIT guatemalteco sea válido (formato básico).
 * @param {string} nit
 * @returns {boolean}
 */
export const esNITValido = (nit) => {
  if (!nit) return true; // campo opcional
  return /^\d{1,8}-\d$/.test(nit.trim()) || /^\d{6,9}$/.test(nit.trim());
};

/**
 * Valida que un número de teléfono guatemalteco sea válido.
 * @param {string} telefono
 * @returns {boolean}
 */
export const esTelefonoValido = (telefono) => {
  if (!telefono) return true; // campo opcional
  return /^(\+502\s?)?\d{4}-?\d{4}$/.test(telefono.trim());
};

/**
 * Valida que un precio sea un número positivo válido.
 * @param {string|number} precio
 * @returns {boolean}
 */
export const esPrecioValido = (precio) => {
  const num = parseFloat(precio);
  return !isNaN(num) && num > 0;
};

/**
 * Valida campos requeridos de un formulario.
 * @param {Object} datos   - Datos del formulario
 * @param {string[]} requeridos - Claves de campos obligatorios
 * @returns {Object} errores por campo
 */
export const validarCamposRequeridos = (datos, requeridos) => {
  const errores = {};
  requeridos.forEach(campo => {
    const valor = datos[campo];
    if (valor === undefined || valor === null || String(valor).trim() === '') {
      errores[campo] = 'Este campo es obligatorio.';
    }
  });
  return errores;
};
