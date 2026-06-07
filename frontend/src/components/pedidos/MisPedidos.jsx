/**
 * MegaMercados - Mis Pedidos (Vista Cliente)
 */
import React, { useState, useEffect } from 'react';
import { pedidosService } from '../../services/api';

const ESTADO_CONFIG = {
  PENDIENTE: { color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  PAGADO: { color: 'bg-green-100 text-green-700', icon: '✅' },
  PROCESANDO: { color: 'bg-blue-100 text-blue-700', icon: '⚙️' },
  ENVIADO: { color: 'bg-purple-100 text-purple-700', icon: '🚚' },
  ENTREGADO: { color: 'bg-gray-100 text-gray-700', icon: '📦' },
  CANCELADO: { color: 'bg-red-100 text-red-700', icon: '❌' },
  REEMBOLSADO: { color: 'bg-orange-100 text-orange-700', icon: '↩️' },
};

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await pedidosService.listar();
        setPedidos(res.data.results || res.data || []);
      } catch { }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div className="flex justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Mis Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">{pedidos.length} pedidos en total</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
          <span className="text-6xl block mb-4">🛍️</span>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Aún no tienes pedidos</h3>
          <p className="text-gray-400 text-sm">Explora nuestro catálogo y realiza tu primera compra</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map(pedido => {
            const estado = ESTADO_CONFIG[pedido.estado] || { color: 'bg-gray-100 text-gray-600', icon: '📄' };
            return (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setPedidoDetalle(pedidoDetalle?.id === pedido.id ? null : pedido)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg">
                      {estado.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Pedido #{pedido.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(pedido.fecha_pedido).toLocaleDateString('es-GT', {
                          weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">Q{parseFloat(pedido.total).toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estado.color}`}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {pedidoDetalle?.id === pedido.id && pedido.detalles?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 animate-slide-down">
                    {pedido.detalles.map(d => (
                      <div key={d.id} className="flex items-center gap-3 py-1">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {d.producto_imagen
                            ? <img src={d.producto_imagen} alt={d.producto_nombre} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm">🛒</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{d.producto_nombre}</p>
                          <p className="text-xs text-gray-500">{d.cantidad} × Q{parseFloat(d.precio_unitario).toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Q{parseFloat(d.subtotal).toFixed(2)}</p>
                      </div>
                    ))}
                    {parseFloat(pedido.descuento_monto) > 0 && (
                      <div className="flex justify-between text-sm text-green-700 pt-2 border-t border-green-100">
                        <span>Descuento aplicado ({pedido.descuento_porcentaje}%)</span>
                        <span>-Q{parseFloat(pedido.descuento_monto).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                      <span>Total pagado</span>
                      <span className="text-green-700">Q{parseFloat(pedido.total).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
