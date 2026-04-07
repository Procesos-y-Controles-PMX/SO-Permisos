'use client'

import { useDashboardStats } from '@/hooks/useDashboardStats'


export function DashboardAdmin() {
  const { loading, error, totalAlertas, regionalCounts, storesAlerts } = useDashboardStats()

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-400 animate-pulse">Analizando métricas globales...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-red-500 bg-red-50 rounded-xl m-8">Error al cargar dashboard: {error}</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
          <p className="text-gray-500 mt-1">Visión global de cumplimiento normativo</p>
        </div>
      </div>

      {/* Global Card */}
      <div className="bg-linear-to-br from-red-500 to-red-600 rounded-3xl p-8 text-white shadow-xl shadow-red-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div className="relative z-10">
          <p className="text-red-100 font-medium text-lg mb-2">Alertas de Cumplimiento (Toda la Empresa)</p>
          <div className="flex items-end gap-4">
            <span className="text-7xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
            <span className="text-red-200 mb-2 font-medium">requerimientos pendientes</span>
          </div>
        </div>
      </div>

      {/* Regions Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg> Alertas por Región
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regionalCounts.map((region) => (
            <div key={region.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                {region.nombre_region}
              </p>
              <div className="flex justify-between items-center">
                <span className={`text-3xl font-bold ${region.vencidos > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {region.vencidos}
                </span>
                {region.vencidos > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-100 fill-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stores Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> Tiendas con Incumplimientos
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {storesAlerts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {storesAlerts.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.tienda?.sucursal || 'Sin Sucursal'}</h3>
                    <p className="text-sm text-gray-500 truncate max-w-md">
                      Región: {item.tienda?.region?.nombre_region || 'N/A'} • {item.tipo_permiso?.nombre_permiso || 'Desconocido'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.tipo_alerta === 'Faltante' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.tipo_alerta}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : 'Sin Fecha'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay alertas de cumplimiento activas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
