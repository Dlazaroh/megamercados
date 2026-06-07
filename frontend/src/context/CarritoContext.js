/**
 * MegaMercados - Contexto del Carrito de Compras
 * Gestión global del carrito con cálculo de totales
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const CarritoContext = createContext(null);

export const useCarrito = () => {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
};

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);

  const agregarItem = useCallback((producto, cantidad = 1) => {
    setItems(prev => {
      const existe = prev.find(i => i.producto.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + cantidad, i.producto.stock) }
            : i
        );
      }
      return [...prev, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
    setAbierto(true);
  }, []);

  const eliminarItem = useCallback((productoId) => {
    setItems(prev => prev.filter(i => i.producto.id !== productoId));
  }, []);

  const actualizarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad <= 0) {
      eliminarItem(productoId);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.producto.id === productoId
          ? { ...i, cantidad: Math.min(cantidad, i.producto.stock) }
          : i
      )
    );
  }, [eliminarItem]);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.producto.precio) * i.cantidad), 0);

  return (
    <CarritoContext.Provider value={{
      items,
      abierto,
      setAbierto,
      agregarItem,
      eliminarItem,
      actualizarCantidad,
      vaciarCarrito,
      totalItems,
      subtotal,
    }}>
      {children}
    </CarritoContext.Provider>
  );
};
