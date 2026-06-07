/**
 * MegaMercados - Reportes y Estadísticas (Admin)
 * Gráficas con Recharts de ventas, pedidos y productos
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { pedidosService, productosService, usuariosService } from '../../services/api';

const COLORES = ['#16a34a', '#22c55e', '#86efac', '#4ade80', '#bbf7d0'];

const Reportes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState('ventas');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [pRes, prRes] = await Promise.all([
          pedidosService.listar({ page_size: 100 }),
          productosService.listar({ page_size: 100 }),
        ]);
        setPedidos(pRes.data.results || pRes.data || []);
        setProductos(prRes.data.results || prRes.data || []);
      } catch { }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  // Ventas por mes
  const ventasPorMes = React.useMemo(() => {
    const meses = {};
    pedidos.forEach(p => {
      if (p.estado === 'PAGADO' || p.estado === 'ENTREGADO') {
        const mes = new Date(p.fecha_pedido).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
        meses[mes] = (meses[mes] || 0) + parseFloat(p.total || 0);
      }
    });
    return Object.entries(meses).map(([mes, total]) => ({ mes, total: parseFloat(total.toFixed(2)) })).slice(-6);
  }, [pedidos]);

  // Pedidos por estado
  const pedidosPorEstado = React.useMemo(() => {
    const estados = {};
    pedidos.forEach(p => { estados[p.estado] = (estados[p.estado] || 0) + 1; });
    return Object.entries(estados).map(([estado, cantidad]) => ({ estado, cantidad }));
  }, [pedidos]);

  // Productos con bajo stock
  const stockBajo = productos.filter(p => p.stock <= (p.stock_minimo || 5)).slice(0, 8);

  // KPIs
  const pedidosPagados = pedidos.filter(p => ['PAGADO', 'ENTREGADO'].includes(p.estado));
  const totalVentas = pedidosPagados.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const ticketPromedio = pedidosPagados.length ? totalVentas / pedidosPagados.length : 0;

  const TABS = [
    { id: 'ventas', label: '📈 Ventas' },
    { id: 'pedidos', label: '🛒 Pedidos' },
    { id: 'inventario', label: '📦 Inventario' },
  ];

  if (cargando) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Reportes y Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-1">Visión general del negocio MegaMercados</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Ventas', valor: `Q${totalVentas.toFixed(2)}`, icon: '💰', color: 'text-green-700 bg-green-50' },
          { label: 'Pedidos Completados', valor: pedidosPagados.length, icon: '✅', color: 'text-blue-700 bg-blue-50' },
          { label: 'Ticket Promedio', valor: `Q${ticketPromedio.toFixed(2)}`, icon: '🧾', color: 'text-purple-700 bg-purple-50' },
          { label: 'Productos Activos', valor: productos.length, icon: '📦', color: 'text-orange-700 bg-orange-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${k.color}`}>{k.icon}</div>
            <p className="text-xl font-bold text-gray-900">{k.valor}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTabActiva(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tabActiva === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      {tabActiva === 'ventas' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-5">Ventas por Mes (Q)</h3>
          {ventasPorMes.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No hay datos de ventas aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ventasPorMes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `Q${v}`} />
                <Tooltip formatter={v => [`Q${v.toFixed(2)}`, 'Ventas']} />
                <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tabActiva === 'pedidos' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-5">Pedidos por Estado</h3>
            {pedidosPorEstado.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No hay pedidos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pedidosPorEstado} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={90} label={({ estado, percent }) => `${estado} ${(percent * 100).toFixed(0)}%`}>
                    {pedidosPorEstado.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Resumen por Estado</h3>
            <div className="space-y-3">
              {pedidosPorEstado.map((e, i) => (
                <div key={e.estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORES[i % COLORES.length] }} />
                    <span className="text-sm text-gray-700">{e.estado}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{e.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'inventario' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Productos con Stock Bajo</h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{stockBajo.length} alertas</span>
          </div>
          {stockBajo.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl mb-2 block">✅</span>
              <p>Todo el inventario está en niveles adecuados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stockBajo.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.categoria_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{p.stock} uds</p>
                    <p className="text-xs text-gray-400">mín: {p.stock_minimo || 5}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reportes;
