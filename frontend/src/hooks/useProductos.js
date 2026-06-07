/**
 * MegaMercados - Hook useProductos
 * Encapsula la lógica de carga y filtrado del catálogo
 * Principio SRP: responsabilidad única de gestión del estado de productos
 */
import { useState, useEffect, useCallback } from 'react';
import { productosService } from '../services/api';

/**
 * Hook para gestionar el estado del catálogo de productos.
 * @param {Object} filtrosIniciales - Filtros iniciales opcionales
 * @returns {Object} estado y funciones del catálogo
 */
const useProductos = (filtrosIniciales = {}) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [paginacion, setPaginacion] = useState({ pagina: 1, total: 0, totalPaginas: 1 });
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    destacado: false,
    ...filtrosIniciales,
  });

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: paginacion.pagina };
      if (filtros.busqueda)  params.search    = filtros.busqueda;
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.destacado) params.destacado = true;

      const [prodRes, catRes] = await Promise.all([
        productosService.listar(params),
        categorias.length === 0 ? productosService.categorias() : Promise.resolve(null),
      ]);

      const data   = prodRes.data.results ?? prodRes.data ?? [];
      const count  = prodRes.data.count   ?? data.length;

      setProductos(data);
      setPaginacion(prev => ({ ...prev, total: count, totalPaginas: Math.ceil(count / 20) || 1 }));
      if (catRes) setCategorias(catRes.data.results ?? catRes.data ?? []);
    } catch (err) {
      setError(err.response?.data?.mensaje ?? 'Error al cargar productos.');
    } finally {
      setCargando(false);
    }
  }, [filtros, paginacion.pagina]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const cambiarPagina  = (p) => setPaginacion(prev => ({ ...prev, pagina: p }));
  const actualizarFiltro = (key, valor) => {
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
    setFiltros(prev => ({ ...prev, [key]: valor }));
  };
  const limpiarFiltros = () => {
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
    setFiltros({ busqueda: '', categoria: '', destacado: false });
  };

  return {
    productos, categorias, cargando, error,
    paginacion, filtros,
    cargarProductos, cambiarPagina, actualizarFiltro, limpiarFiltros,
  };
};

export default useProductos;
