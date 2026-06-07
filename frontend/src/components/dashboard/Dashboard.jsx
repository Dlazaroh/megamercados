/**
 * MegaMercados - Dashboard Principal
 * Estadísticas generales y accesos rápidos
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productosService, pedidosService, usuariosService } from '../../services/api';

const Dashboard = () => {
  const { usuario, esAdmin, esMayorista, esMinorista } = useAuth();
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, usuarios: 0, ventas: 0 });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [prodRes, pedRes] = await Promise.all([
          productosService.listar({ page_size: 1 }),
          pedidosService.listar({ page_size: 5 }),
        ]);
        const pedidos = pedRes.data.results || pedRes.data || [];
        const totalVentas = pedidos.reduce((s, p) => s + parseFloat(p.total || 0), 0);
        setStats(prev => ({
          ...prev,
          productos: prodRes.data.count || 0,
          pedidos: pedRes.data.count || pedidos.length,
          ventas: totalVentas,
        }));
        setPedidosRecientes(pedidos.slice(0, 5));

        if (esAdmin) {
          const uRes = await usuariosService.listar({ page_size: 1 });
          setStats(prev => ({ ...prev, usuarios: uRes.data.count || 0 }));
        }
      } catch { }
      finally { setCargando(false); }
    };
    cargarDatos();
  }, [esAdmin]);

  const COLORES_ESTADO = {
    PENDIENTE: 'bg-yellow-100 text-yellow-700',
    PAGADO: 'bg-green-100 text-green-700',
    PROCESANDO: 'bg-blue-100 text-blue-700',
    ENVIADO: 'bg-purple-100 text-purple-700',
    ENTREGADO: 'bg-gray-100 text-gray-700',
    CANCELADO: 'bg-red-100 text-red-700',
    REEMBOLSADO: 'bg-orange-100 text-orange-700',
  };

  const statsCards = esAdmin ? [
    { label: 'Productos', valor: stats.productos, icono: '📦', color: 'bg-blue-50 text-blue-700', to: '/dashboard/productos' },
    { label: 'Pedidos', valor: stats.pedidos, icono: '🛒', color: 'bg-green-50 text-green-700', to: '/dashboard/pedidos' },
    { label: 'Usuarios', valor: stats.usuarios, icono: '👥', color: 'bg-purple-50 text-purple-700', to: '/dashboard/usuarios' },
    { label: 'Ventas', valor: `Q${stats.ventas.toFixed(2)}`, icono: '💰', color: 'bg-yellow-50 text-yellow-700', to: '/dashboard/reportes' },
  ] : [
    { label: 'Mis Pedidos', valor: stats.pedidos, icono: '🛒', color: 'bg-green-50 text-green-700', to: '/dashboard/mis-pedidos' },
    { label: 'Total Gastado', valor: `Q${stats.ventas.toFixed(2)}`, icono: '💰', color: 'bg-yellow-50 text-yellow-700', to: '/dashboard/mis-pedidos' },
    { label: 'Tipo de Cliente', valor: usuario?.rol, icono: '🏷️', color: 'bg-blue-50 text-blue-700', to: '/dashboard/perfil' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-green-200 text-sm font-medium mb-1">Bienvenido de vuelta</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">
              {usuario?.nombre_completo?.split(' ')[0]} 👋
            </h1>
            <p className="text-green-200 text-sm mt-2">
              {esAdmin ? 'Panel de Administración · MegaMercados' :
               esMayorista ? 'Cliente Mayorista · Descuento 15% en compras &gt; Q1,000' :
               esMinorista ? 'Cliente Minorista · Descuento 10% en compras &gt; Q200' : 'Invitado'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/productos"
              className="px-5 py-2.5 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-all text-sm shadow-sm"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="bg-gray-200 h-10 w-10 rounded-xl mb-3" />
              <div className="bg-gray-200 h-6 w-16 rounded-lg mb-1" />
              <div className="bg-gray-200 h-4 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-2 ${esAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
          {statsCards.map(s => (
            <Link
              key={s.label}
              to={s.to}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>
                {s.icono}
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.valor}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Módulos de acceso rápido */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 font-display">Módulos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ModuloCard to="/dashboard/productos" icono="🛍️" titulo="Catálogo" desc="Ver productos" color="green" />
          {!esAdmin && <ModuloCard to="/dashboard/mis-pedidos" icono="📦" titulo="Mis Pedidos" desc="Historial" color="blue" />}
          {esAdmin && <ModuloCard to="/dashboard/usuarios" icono="👥" titulo="Usuarios" desc="Gestionar" color="purple" />}
          {esAdmin && <ModuloCard to="/dashboard/reportes" icono="📊" titulo="Reportes" desc="Estadísticas" color="orange" />}
        </div>
      </div>

      {/* Pedidos recientes */}
      {pedidosRecientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 font-display">
              {esAdmin ? 'Últimos Pedidos' : 'Mis Pedidos Recientes'}
            </h2>
            <Link to={esAdmin ? '/dashboard/pedidos' : '/dashboard/mis-pedidos'} className="text-sm text-green-600 hover:text-green-800 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold"># Pedido</th>
                    {esAdmin && <th className="text-left px-4 py-3 font-semibold">Cliente</th>}
                    <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pedidosRecientes.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-700">#{p.id}</td>
                      {esAdmin && <td className="px-4 py-3 text-gray-600">{p.usuario_nombre}</td>}
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.fecha_pedido).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${COLORES_ESTADO[p.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">Q{parseFloat(p.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuloCard = ({ to, icono, titulo, desc, color }) => {
  const colores = {
    green: 'bg-green-50 hover:bg-green-100 text-green-800',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-800',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-800',
  };
  return (
    <Link to={to} className={`${colores[color]} rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
      <span className="text-3xl block mb-3">{icono}</span>
      <p className="font-bold font-display">{titulo}</p>
      <p className="text-xs mt-0.5 opacity-70">{desc}</p>
    </Link>
  );
};

export default Dashboard;
