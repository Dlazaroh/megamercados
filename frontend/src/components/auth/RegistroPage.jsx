/**
 * MegaMercados - Registro de Usuario
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const RegistroPage = () => {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    password: '', password_confirm: '', rol: 'MINORISTA',
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});
    setCargando(true);
    try {
      await authService.registro(form);
      navigate('/login', { state: { mensaje: '¡Cuenta creada! Inicia sesión.' } });
    } catch (err) {
      setErrores(err.response?.data?.errores || { general: 'Error al crear la cuenta.' });
    } finally { setCargando(false); }
  };

  const campo = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type} value={form[name]} onChange={set(name)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${errores[name] ? 'border-red-300' : 'border-gray-200'}`}
      />
      {errores[name] && <p className="text-xs text-red-600 mt-1">{errores[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-2xl mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-green-800">MegaMercados</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-green-100">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Crear Cuenta</h2>

          {errores.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errores.general}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {campo('nombre', 'Nombre *', 'text', 'Juan')}
              {campo('apellido', 'Apellido *', 'text', 'García')}
            </div>
            {campo('email', 'Correo Electrónico *', 'email', 'correo@ejemplo.com')}
            {campo('telefono', 'Teléfono', 'tel', '+502 0000-0000')}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Cuenta</label>
              <select value={form.rol} onChange={set('rol')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="MINORISTA">Minorista (compras personales)</option>
                <option value="MAYORISTA">Mayorista (compras por volumen)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {form.rol === 'MAYORISTA' ? '✓ Descuento 15% en compras mayores a Q1,000' : '✓ Descuento 10% en compras mayores a Q200'}
              </p>
            </div>

            {campo('password', 'Contraseña *', 'password', '••••••••')}
            {campo('password_confirm', 'Confirmar Contraseña *', 'password', '••••••••')}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {cargando ? (
                <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creando cuenta...</>
              ) : 'Crear Cuenta Gratis'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors">Iniciar Sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroPage;
