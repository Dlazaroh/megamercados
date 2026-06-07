/**
 * MegaMercados - Formulario de Producto (Admin)
 * Crear/editar productos con validación y subida de imagen
 */
import React, { useState, useEffect } from 'react';
import { productosService } from '../../services/api';

const FormularioProducto = ({ producto, categorias, onCerrar, onGuardado }) => {
  const esEdicion = !!producto;
  const [form, setForm] = useState({
    nombre: '', descripcion: '', codigo: '', precio: '',
    stock: '', stock_minimo: '5', categoria: '', destacado: false,
  });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        codigo: producto.codigo || '',
        precio: producto.precio || '',
        stock: producto.stock || '',
        stock_minimo: producto.stock_minimo || '5',
        categoria: producto.categoria || '',
        destacado: producto.destacado || false,
      });
      if (producto.imagen_url) setPreview(producto.imagen_url);
    }
  }, [producto]);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrores({});

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (imagen) formData.append('imagen', imagen);

    try {
      if (esEdicion) {
        await productosService.actualizar(producto.id, formData);
      } else {
        await productosService.crear(formData);
      }
      onGuardado();
    } catch (err) {
      if (err.response?.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setErrores({ general: 'Error al guardar el producto.' });
      }
    } finally {
      setCargando(false);
    }
  };

  const campo = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${errores[name] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
      />
      {errores[name] && <p className="text-xs text-red-600 mt-1">{errores[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
          <h2 className="font-bold text-gray-900 font-display">
            {esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errores.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errores.general}</div>
          )}

          {/* Imagen */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Imagen del Producto</label>
            <div
              className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-green-400 transition-colors"
              style={{ minHeight: '120px' }}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-32 object-cover" />
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Haz clic para subir imagen</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImagenChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">{campo('nombre', 'Nombre del Producto *', 'text', 'Ej. Arroz blanco 5 lb')}</div>
            {campo('codigo', 'Código *', 'text', 'Ej. ARR-001')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría *</label>
              <select
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {campo('precio', 'Precio (Q) *', 'number', '0.00')}
            {campo('stock', 'Stock *', 'number', '0')}
            {campo('stock_minimo', 'Stock Mínimo', 'number', '5')}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Descripción del producto..."
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="destacado"
                checked={form.destacado}
                onChange={e => setForm(p => ({ ...p, destacado: e.target.checked }))}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="destacado" className="text-sm font-medium text-gray-700">Marcar como producto destacado</label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {cargando ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Guardando...</>
              ) : (esEdicion ? 'Actualizar' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioProducto;
