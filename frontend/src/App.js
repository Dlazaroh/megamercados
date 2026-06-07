/**
 * MegaMercados - Router Principal
 * Rutas protegidas según rol de usuario
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';

// Auth
import LoginPage from './components/auth/LoginPage';
import RegistroPage from './components/auth/RegistroPage';
import RecuperarContrasena from './components/auth/RecuperarContrasena';

// Layout
import Layout from './components/layout/Layout';
import Carrito from './components/carrito/Carrito';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';
import CatalogoProductos from './components/productos/CatalogoProductos';
import GestionUsuarios from './components/usuarios/GestionUsuarios';
import Reportes from './components/reportes/Reportes';
import MisPedidos from './components/pedidos/MisPedidos';

// Ruta protegida genérica
const RutaProtegida = ({ children, rolesPermitidos }) => {
  const { autenticado, usuario, cargando } = useAuth();

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">Cargando MegaMercados...</p>
      </div>
    </div>
  );

  if (!autenticado) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout envuelto con carrito
const DashboardLayout = ({ children }) => (
  <Layout>
    {children}
    <Carrito />
  </Layout>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CarritoProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

          {/* Redirigir raíz */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas protegidas del Dashboard */}
          <Route path="/dashboard" element={
            <RutaProtegida>
              <DashboardLayout><Dashboard /></DashboardLayout>
            </RutaProtegida>
          } />

          <Route path="/dashboard/productos" element={
            <RutaProtegida>
              <DashboardLayout><CatalogoProductos /></DashboardLayout>
            </RutaProtegida>
          } />

          <Route path="/dashboard/mis-pedidos" element={
            <RutaProtegida rolesPermitidos={['MINORISTA', 'MAYORISTA']}>
              <DashboardLayout><MisPedidos /></DashboardLayout>
            </RutaProtegida>
          } />

          <Route path="/dashboard/usuarios" element={
            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
              <DashboardLayout><GestionUsuarios /></DashboardLayout>
            </RutaProtegida>
          } />

          <Route path="/dashboard/reportes" element={
            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
              <DashboardLayout><Reportes /></DashboardLayout>
            </RutaProtegida>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-7xl font-bold text-green-200 font-display">404</p>
                <h1 className="text-xl font-bold text-gray-700 mt-2">Página no encontrada</h1>
                <a href="/dashboard" className="mt-4 inline-block px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
                  Ir al inicio
                </a>
              </div>
            </div>
          } />
        </Routes>
      </CarritoProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
