/**
 * MegaMercados - Carrito de Compras (Sidebar Modal)
 * Muestra imagen, precio unitario, cantidad y total
 * Integra con Stripe para procesar el pago
 */
import React, { useState } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { useAuth } from '../../context/AuthContext';
import { pedidosService } from '../../services/api';
import ModalPagoExitoso from './ModalPagoExitoso';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const Carrito = () => {
  const { items, abierto, setAbierto, eliminarItem, actualizarCantidad, vaciarCarrito, subtotal, totalItems } = useCarrito();
  const { usuario, esAdmin } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [pedidoExitoso, setPedidoExitoso] = useState(null);

  // Cálculo de descuento según reglas de negocio
  const calcularDescuento = () => {
    if (!usuario) return { pct: 0, monto: 0 };
    if (usuario.rol === 'MINORISTA' && subtotal > 200) return { pct: 10, monto: subtotal * 0.10 };
    if (usuario.rol === 'MAYORISTA' && subtotal > 1000) return { pct: 15, monto: subtotal * 0.15 };
    return { pct: 0, monto: 0 };
  };

  const descuento = calcularDescuento();
  const total = subtotal - descuento.monto;

  const handleProcesarPago = async () => {
    if (!usuario || esAdmin) {
      setError('Debes iniciar sesión como cliente para comprar.');
      return;
    }
    if (items.length === 0) return;

    setProcesando(true);
    setError('');

    try {
      const itemsPayload = items.map(i => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
      }));

      const response = await pedidosService.crear(itemsPayload);
      const { pedido, client_secret } = response.data;

      // En producción: usar Stripe.js con client_secret para confirmar pago
      // Aquí simulamos confirmación directa para demo
      if (client_secret) {
        await pedidosService.confirmarPago(pedido.id, pedido.stripe_payment_intent_id);
      }

      setPedidoExitoso(pedido);
      vaciarCarrito();
      setAbierto(false);

    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al procesar el pedido.';
      setError(msg);
    } finally {
      setProcesando(false);
    }
  };

  if (!abierto) return (
    <>
      {pedidoExitoso && (
        <ModalPagoExitoso pedido={pedidoExitoso} onCerrar={() => setPedidoExitoso(null)} />
      )}
    </>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setAbierto(false)}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 font-display">Mi Carrito</h2>
              <p className="text-xs text-gray-500">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
            </div>
          </div>
          <button
            onClick={() => setAbierto(false)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium text-gray-500">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Agrega productos del catálogo</p>
            </div>
          ) : (
            items.map(({ producto, cantidad }) => (
              <div key={producto.id} className="flex gap-3 p-3 bg-gray-50 rounded-2xl">
                {/* Imagen */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                  {producto.imagen_url ? (
                    <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{producto.nombre}</p>
                  <p className="text-xs text-green-700 font-bold mt-0.5">Q{parseFloat(producto.precio).toFixed(2)} c/u</p>

                  {/* Controles cantidad */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => actualizarCantidad(producto.id, cantidad - 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm"
                    >−</button>
                    <span className="text-sm font-bold text-gray-800 w-6 text-center">{cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(producto.id, cantidad + 1)}
                      disabled={cantidad >= producto.stock}
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all text-sm disabled:opacity-40"
                    >+</button>
                  </div>
                </div>

                {/* Subtotal y eliminar */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => eliminarItem(producto.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <p className="text-sm font-bold text-gray-900">Q{(parseFloat(producto.precio) * cantidad).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con totales y botón de pago */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-3">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Q{subtotal.toFixed(2)}</span>
              </div>
              {descuento.pct > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      -{descuento.pct}%
                    </span>
                    Descuento {usuario?.rol === 'MAYORISTA' ? 'mayorista' : 'minorista'}
                  </span>
                  <span>-Q{descuento.monto.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total a pagar</span>
                <span className="text-green-700">Q{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProcesarPago}
              disabled={procesando || esAdmin}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {procesando ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando pago...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pagar con Stripe
                </>
              )}
            </button>

            {esAdmin && (
              <p className="text-center text-xs text-gray-400">Los administradores no pueden realizar compras</p>
            )}
          </div>
        )}
      </div>

      {pedidoExitoso && (
        <ModalPagoExitoso pedido={pedidoExitoso} onCerrar={() => setPedidoExitoso(null)} />
      )}
    </>
  );
};

export default Carrito;
