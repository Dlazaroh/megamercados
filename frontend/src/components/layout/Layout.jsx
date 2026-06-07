/**
 * MegaMercados - Layout Principal
 * Header responsivo con logo, navegación y carrito
 * Diseño mobile-first
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCarrito } from '../../context/CarritoContext';

const Layout = ({ children }) => {
  const { usuario, logout, esAdmin } = useAuth();
  const { totalItems, setAbierto } = useCarrito();
  const [menuMobile, setMenuMobile] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Inicio', icon: '🏠' },
    { to: '/dashboard/productos', label: 'Catálogo', icon: '🛒' },
    ...(esAdmin ? [
      { to: '/dashboard/usuarios', label: 'Usuarios', icon: '👥' },
      { to: '/dashboard/reportes', label: 'Reportes', icon: '📊' },
    ] : [
      { to: '/dashboard/mis-pedidos', label: 'Mis Pedidos', icon: '📦' },
    ]),
  ];

  const esActivo = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo - izquierda */}
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-bold text-green-800 text-lg font-display hidden sm:block">MegaMercados</span>
            </Link>

            {/* Nav desktop - centro */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    esActivo(link.to)
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Derecha: carrito + usuario */}
            <div className="flex items-center gap-2">

              {/* Botón carrito */}
              <button
                onClick={() => setAbierto(true)}
                className="relative p-2.5 rounded-xl hover:bg-green-50 text-gray-600 hover:text-green-700 transition-all"
                aria-label="Carrito de compras"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {/* Menu usuario */}
              <div className="relative">
                <button
                  onClick={() => setMenuUsuario(!menuUsuario)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {usuario?.nombre_completo?.[0] || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800 leading-none">{usuario?.nombre_completo?.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{usuario?.rol}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuUsuario && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-medium text-gray-800">{usuario?.nombre_completo}</p>
                      <p className="text-xs text-gray-500">{usuario?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/perfil"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMenuUsuario(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Botón hamburguesa mobile */}
              <button
                onClick={() => setMenuMobile(!menuMobile)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuMobile ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav mobile */}
          {menuMobile && (
            <div className="md:hidden pb-4 pt-2 border-t border-gray-100 animate-slide-down">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuMobile(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    esActivo(link.to) ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Overlay para cerrar menus */}
      {(menuUsuario || menuMobile) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setMenuUsuario(false); setMenuMobile(false); }}
        />
      )}
    </div>
  );
};

export default Layout;
