'use client'

import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useAuth } from '@/contexts/AuthContext'

export function DashboardRegional() {
  const { loading, error, totalAlertas, storesAlerts } = useDashboardStats()
  const { perfil } = useAuth()

  // Get the region name from the profile if available, otherwise fallback
  const regionName = perfil?.region?.nombre_region 
    || storesAlerts[0]?.tienda?.region?.nombre_region 
    || 'Tu Zona'

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-400 animate-pulse">Sincronizando métricas de región...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Regional</h1>
          <p className="text-gray-500 mt-1">Región: <span className="font-semibold text-gray-700">{regionName}</span></p>
        </div>
      </div>

      {/* Regional Card */}
      <div className="bg-linear-to-br from-brand-orange to-red-500 rounded-3xl p-8 text-white shadow-xl shadow-brand-orange/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div className="relative z-10">
          <p className="text-white/80 font-medium text-lg mb-2">Alertas de Cumplimiento en la Región</p>
          <div className="flex items-end gap-4">
            <span className="text-7xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
            <span className="text-white/80 mb-2 font-medium">requerimientos pendientes a resolver</span>
          </div>
        </div>
      </div>

      {/* Stores Breakdown for this region */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> Detalle de Tiendas (Región)
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {storesAlerts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {storesAlerts.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.tienda?.sucursal || 'Sin Sucursal'}</h3>
                    <p className="text-sm text-gray-500">
                      Permiso: <span className="font-medium text-gray-700">{item.tipo_permiso?.nombre_permiso || 'Desconocido'}</span>
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
            <div className="p-12 text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">✓</div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">¡Excelente trabajo!</h3>
              <p className="text-gray-500">
                Actualmente no hay alertas de cumplimiento en ninguna de tus tiendas asignadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
