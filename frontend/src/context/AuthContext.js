/**
 * MegaMercados - Contexto de Autenticación
 * Gestión global del estado de autenticación con JWT
 * Principio SRP: responsabilidad única de gestión del estado auth
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('access_token');

    if (usuarioGuardado && token) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.clear();
      }
    }
    setCargando(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const data = response.data;

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } finally {
      localStorage.clear();
      setUsuario(null);
    }
  }, []);

  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const esMayorista = usuario?.rol === 'MAYORISTA';
  const esMinorista = usuario?.rol === 'MINORISTA';

  return (
    <AuthContext.Provider value={{
      usuario,
      cargando,
      login,
      logout,
      esAdmin,
      esMayorista,
      esMinorista,
      autenticado: !!usuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
