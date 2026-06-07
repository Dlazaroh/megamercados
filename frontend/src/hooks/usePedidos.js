/**
 * MegaMercados - Hook usePedidos
 * Encapsula la lógica de gestión y consulta de pedidos
 */
import { useState, useEffect, useCallback } from 'react';
import { pedidosService } from '../services/api';

/**
 * Hook para gestionar el historial de pedidos del usuario.
 * @returns {Object} pedidos, estado de carga y funciones
 */
const usePedidos = () => {
  const [pedidos, setPedidos]     = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState(null);
  const [total, setTotal]         = useState(0);

  const cargarPedidos = useCallback(async (params = {}) => {
    setCargando(true);
    setError(null);
    try {
      const res  = await pedidosService.listar(params);
      const data = res.data.results ?? res.data ?? [];
      setPedidos(data);
      setTotal(res.data.count ?? data.length);
    } catch (err) {
      setError(err.response?.data?.mensaje ?? 'Error al cargar pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPedidos(); }, [cargarPedidos]);

  /**
   * Confirma el pago de un pedido y actualiza el estado local.
   */
  const confirmarPago = useCallback(async (pedidoId, paymentIntentId) => {
    try {
      const res = await pedidosService.confirmarPago(pedidoId, paymentIntentId);
      setPedidos(prev =>
        prev.map(p => p.id === pedidoId ? res.data.pedido : p)
      );
      return { success: true, pedido: res.data.pedido };
    } catch (err) {
      return { success: false, mensaje: err.response?.data?.mensaje ?? 'Error al confirmar pago.' };
    }
  }, []);

  return { pedidos, cargando, error, total, cargarPedidos, confirmarPago };
};

export default usePedidos;
