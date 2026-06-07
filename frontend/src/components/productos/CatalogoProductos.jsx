/**
 * MegaMercados - Catálogo de Productos
 * Modal con información detallada de cada producto
 * Principio SRP: responsabilidad única de mostrar el catálogo
 */
import React, { useState, useEffect, useCallback } from 'react';
import { productosService } from '../../services/api';
import { useCarrito } from '../../context/CarritoContext';
import { useAuth } from '../../context/AuthContext';
import ModalProducto from './ModalProducto';
import FormularioProducto from './FormularioProducto';

const CatalogoProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const { agregarItem } = useCarrito();
  const { esAdmin } = useAuth();

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const params = { page: paginaActual };
      if (busqueda) params.search = busqueda;
      if (categoriaSeleccionada) params.categoria = categoriaSeleccionada;

      const [prodRes, catRes] = await Promise.all([
        productosService.listar(params),
        productosService.categorias(),
      ]);

      setProductos(prodRes.data.results || prodRes.data);
      setCategorias(catRes.data.results || catRes.data);

      if (prodRes.data.count) {
        setTotalPaginas(Math.ceil(prodRes.data.count / 20));
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setCargando(false);
    }
  }, [busqueda, categoriaSeleccionada, paginaActual]);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => setPaginaActual(1), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await productosService.eliminar(id);
      cargarProductos();
    } catch { }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">{productos.length} productos disponibles</p>
        </div>
        {esAdmin && (
          <button
            onClick={() => { setProductoEditar(null); setMostrarFormulario(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>
        <select
          value={categoriaSeleccionada}
          onChange={e => { setCategoriaSeleccionada(e.target.value); setPaginaActual(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      {/* Grid de productos */}
      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="bg-gray-200 h-36 rounded-xl mb-3" />
              <div className="bg-gray-200 h-4 rounded-lg mb-2" />
              <div className="bg-gray-200 h-3 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="font-medium">No se encontraron productos</p>
          <p className="text-sm mt-1">Prueba con otros filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {productos.map(producto => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              esAdmin={esAdmin}
              onVerDetalle={() => setProductoSeleccionado(producto)}
              onAgregarCarrito={() => agregarItem(producto)}
              onEditar={() => { setProductoEditar(producto); setMostrarFormulario(true); }}
              onEliminar={() => handleEliminar(producto.id)}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">Página {paginaActual} de {totalPaginas}</span>
          <button
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Modals */}
      {productoSeleccionado && (
        <ModalProducto
          producto={productoSeleccionado}
          onCerrar={() => setProductoSeleccionado(null)}
          onAgregarCarrito={() => { agregarItem(productoSeleccionado); setProductoSeleccionado(null); }}
        />
      )}

      {mostrarFormulario && (
        <FormularioProducto
          producto={productoEditar}
          categorias={categorias}
          onCerrar={() => { setMostrarFormulario(false); setProductoEditar(null); }}
          onGuardado={() => { setMostrarFormulario(false); setProductoEditar(null); cargarProductos(); }}
        />
      )}
    </div>
  );
};

// ─── Tarjeta de producto ──────────────────────────────────────────────────────
const TarjetaProducto = ({ producto, esAdmin, onVerDetalle, onAgregarCarrito, onEditar, onEliminar }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
    {/* Imagen */}
    <div
      className="relative h-36 bg-gray-50 cursor-pointer overflow-hidden"
      onClick={onVerDetalle}
    >
      {producto.imagen_url ? (
        <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
      )}
      {!producto.tiene_stock && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">Sin stock</span>
        </div>
      )}
      {producto.destacado && (
        <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Destacado</span>
      )}
    </div>

    {/* Info */}
    <div className="p-3">
      <p className="text-xs text-gray-400 mb-0.5">{producto.categoria_nombre}</p>
      <h3
        className="text-sm font-semibold text-gray-800 leading-tight cursor-pointer hover:text-green-700 transition-colors line-clamp-2"
        onClick={onVerDetalle}
      >
        {producto.nombre}
      </h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-base font-bold text-green-700">Q{parseFloat(producto.precio).toFixed(2)}</span>
        <span className="text-xs text-gray-400">Stock: {producto.stock}</span>
      </div>

      {/* Botones */}
      {esAdmin ? (
        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={onEditar}
            className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onEliminar}
            className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <button
          onClick={onAgregarCarrito}
          disabled={!producto.tiene_stock}
          className="w-full mt-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-all"
        >
          {producto.tiene_stock ? '+ Agregar' : 'Sin stock'}
        </button>
      )}
    </div>
  </div>
);

export default CatalogoProductos;
