/**
 * MegaMercados - Gestión de Usuarios (Admin)
 * Listado, roles y administración de cuentas
 */
import React, { useState, useEffect, useCallback } from 'react';
import { usuariosService } from '../../services/api';

const ROLES = ['ADMINISTRADOR', 'MAYORISTA', 'MINORISTA', 'INVITADO'];

const BADGE_ROL = {
  ADMINISTRADOR: 'bg-red-100 text-red-700',
  MAYORISTA: 'bg-blue-100 text-blue-700',
  MINORISTA: 'bg-green-100 text-green-700',
  INVITADO: 'bg-gray-100 text-gray-600',
};

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (busqueda) params.search = busqueda;
      if (filtroRol) params.rol = filtroRol;
      const res = await usuariosService.listar(params);
      const data = res.data.results || res.data;
      setUsuarios(data);
      setTotal(res.data.count || data.length);
    } catch { }
    finally { setCargando(false); }
  }, [busqueda, filtroRol]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCambiarRol = async (id, nuevoRol) => {
    try {
      await usuariosService.actualizarRol(id, nuevoRol);
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
    } catch { alert('Error al actualizar rol.'); }
  };

  const handleDesactivar = async (id, activo) => {
    if (!window.confirm(activo ? '¿Desactivar usuario?' : '¿Activar usuario?')) return;
    try {
      await usuariosService.listar(); // placeholder - usar endpoint correcto
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, is_active: !activo } : u));
    } catch { }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{total} usuarios registrados</p>
        </div>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(rol => {
          const count = usuarios.filter(u => u.rol === rol).length;
          return (
            <button
              key={rol}
              onClick={() => setFiltroRol(filtroRol === rol ? '' : rol)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${filtroRol === rol ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${BADGE_ROL[rol]}`}>{rol}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
            </button>
          );
        })}
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
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>
        <select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
        >
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-400">
            <svg className="animate-spin w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <span className="text-4xl mb-3 block">👥</span>
            <p className="font-medium">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold">Registro</th>
                  <th className="text-left px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.nombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.nombre_completo}</p>
                          {u.telefono && <p className="text-xs text-gray-400">{u.telefono}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        onChange={e => handleCambiarRol(u.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${BADGE_ROL[u.rol]}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.fecha_creacion).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDesactivar(u.id, u.is_active)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;
