/**
 * MegaMercados - Modal de Detalle de Producto
 * Muestra nombre, precio, stock e información completa del producto
 */
import React, { useState } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { useAuth } from '../../context/AuthContext';

const ModalProducto = ({ producto, onCerrar, onAgregarCarrito }) => {
  const [cantidad, setCantidad] = useState(1);
  const { esAdmin } = useAuth();

  if (!producto) return null;

  const handleAgregar = () => {
    onAgregarCarrito(producto, cantidad);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Imagen */}
        <div className="relative h-56 bg-gray-100">
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-green-50 to-green-100">
              🛒
            </div>
          )}
          <button
            onClick={onCerrar}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {producto.destacado && (
            <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              ⭐ Destacado
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                {producto.categoria_nombre}
              </span>
              <h2 className="text-xl font-bold text-gray-900 font-display mt-2">{producto.nombre}</h2>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-green-700">Q{parseFloat(producto.precio).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-0.5">precio unitario</p>
            </div>
          </div>

          {producto.descripcion && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{producto.descripcion}</p>
          )}

          {/* Stock info */}
          <div className="flex items-center gap-4 mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${producto.tiene_stock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-gray-700">
                {producto.tiene_stock ? `${producto.stock} en stock` : 'Sin stock'}
              </span>
            </div>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-500 font-mono">Código: {producto.codigo}</span>
          </div>

          {/* Selector de cantidad + botón */}
          {!esAdmin && producto.tiene_stock && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 hover:text-red-600 font-bold transition-colors"
                >−</button>
                <span className="w-10 text-center font-bold text-gray-900">{cantidad}</span>
                <button
                  onClick={() => setCantidad(c => Math.min(producto.stock, c + 1))}
                  className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 hover:text-green-600 font-bold transition-colors"
                >+</button>
              </div>
              <button
                onClick={handleAgregar}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Agregar al carrito — Q{(parseFloat(producto.precio) * cantidad).toFixed(2)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalProducto;
