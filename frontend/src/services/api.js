/**
 * MegaMercados - Servicio de API
 * Patrón API Gateway: punto único de comunicación con el backend
 * Maneja automáticamente JWT, refresh tokens y errores
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Instancia principal de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Interceptor de Request: inyecta el token JWT ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor de Response: maneja refresh automático ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        limpiarSesion();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        limpiarSesion();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

const limpiarSesion = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('usuario');
  window.location.href = '/login';
};

// ─── Servicios de Autenticación ───────────────────────────────────────────────
export const authService = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),

  logout: (refreshToken) =>
    api.post('/auth/logout/', { refresh_token: refreshToken }),

  registro: (datos) =>
    api.post('/auth/registro/', datos),

  recuperarContrasena: (email) =>
    api.post('/auth/recuperar-contrasena/', { email }),

  resetContrasena: (token, passwordNuevo, passwordConfirm) =>
    api.post('/auth/reset-contrasena/', {
      token, password_nuevo: passwordNuevo, password_confirm: passwordConfirm
    }),

  perfil: () =>
    api.get('/usuarios/perfil/'),
};

// ─── Servicios de Productos ───────────────────────────────────────────────────
export const productosService = {
  listar: (params = {}) =>
    api.get('/productos/', { params }),

  detalle: (id) =>
    api.get(`/productos/${id}/`),

  destacados: () =>
    api.get('/productos/destacados/'),

  crear: (datos) =>
    api.post('/productos/', datos, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  actualizar: (id, datos) =>
    api.patch(`/productos/${id}/`, datos),

  actualizarPrecio: (id, precio) =>
    api.patch(`/productos/${id}/actualizar_precio/`, { precio }),

  eliminar: (id) =>
    api.delete(`/productos/${id}/`),

  categorias: () =>
    api.get('/productos/categorias/'),
};

// ─── Servicios de Pedidos ─────────────────────────────────────────────────────
export const pedidosService = {
  listar: (params = {}) =>
    api.get('/pedidos/', { params }),

  detalle: (id) =>
    api.get(`/pedidos/${id}/`),

  crear: (items, notas = '') =>
    api.post('/pedidos/crear_pedido/', { items, notas }),

  confirmarPago: (pedidoId, paymentIntentId) =>
    api.post(`/pedidos/${pedidoId}/confirmar_pago/`, {
      payment_intent_id: paymentIntentId
    }),
};

// ─── Servicios de Usuarios (Admin) ────────────────────────────────────────────
export const usuariosService = {
  listar: (params = {}) =>
    api.get('/usuarios/', { params }),

  detalle: (id) =>
    api.get(`/usuarios/${id}/`),

  actualizarRol: (id, rol) =>
    api.patch(`/usuarios/${id}/`, { rol }),

  desactivar: (id) =>
    api.patch(`/usuarios/${id}/`, { is_active: false }),
};

export default api;
