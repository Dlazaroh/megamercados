/**
 * MegaMercados - Modal de Pago Exitoso
 * Muestra imagen del producto, precio, precio unitario y total a pagar
 */
import React from 'react';

const ModalPagoExitoso = ({ pedido, onCerrar }) => {
  if (!pedido) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header verde */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">¡Pago Exitoso!</h2>
          <p className="text-green-100 mt-1 text-sm">Pedido #{pedido.id} confirmado</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Lista de productos */}
          <div className="space-y-3 mb-5 max-h-56 overflow-y-auto">
            {pedido.detalles?.map((detalle) => (
              <div key={detalle.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                  {detalle.producto_imagen ? (
                    <img src={detalle.producto_imagen} alt={detalle.producto_nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{detalle.producto_nombre}</p>
                  <p className="text-xs text-gray-500">
                    {detalle.cantidad} × Q{parseFloat(detalle.precio_unitario).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">Q{parseFloat(detalle.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Resumen de totales */}
          <div className="bg-green-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Q{parseFloat(pedido.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(pedido.descuento_monto) > 0 && (
              <div className="flex justify-between text-sm text-green-700 font-medium">
                <span>Descuento ({pedido.descuento_porcentaje}%)</span>
                <span>-Q{parseFloat(pedido.descuento_monto).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-green-800 pt-2 border-t border-green-200">
              <span>Total pagado</span>
              <span>Q{parseFloat(pedido.total).toFixed(2)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Recibirás una confirmación en tu correo electrónico
          </p>

          <button
            onClick={onCerrar}
            className="w-full mt-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPagoExitoso;
