'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useAuth } from '@/contexts/AuthContext'
import { ProgressBar } from './ProgressBar'

export function DashboardRegional() {
  const { 
    loading, 
    error, 
    totalAlertas, 
    totalRequirements, 
    compliancePercentage, 
    storeComplianceMap,
    storesAlerts 
  } = useDashboardStats()
  const { perfil } = useAuth()

  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  // Get the region name from the profile if available, otherwise fallback
  const regionName = perfil?.region?.nombre_region 
    || storesAlerts[0]?.tienda?.region?.nombre_region 
    || 'Tu Zona'

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-400 animate-pulse">Cargando datos de la región...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-red-500 bg-red-50 rounded-xl m-8">Error: {error}</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Región {regionName}</h1>
          <p className="text-gray-500 mt-1">Gestión de cumplimiento por zona</p>
        </div>
      </div>

      {/* Regional Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-linear-to-br from-brand-orange to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-brand-orange/20 w-full md:w-auto min-w-[240px]">
            <p className="text-white/80 font-medium text-sm mb-1">Alertas en la Región</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
              <span className="text-white/80 mb-1.5 font-medium text-sm">pendientes</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ProgressBar percentage={compliancePercentage} className="mb-2" />
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-orange" />
              Estado de cumplimiento regional ({totalRequirements} requerimientos)
            </p>
          </div>
        </div>
      </div>

      {/* Stores Breakdown for this region */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> Detalle de Tiendas (Región)
          </div>
          {storesAlerts.length > pageSize && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-normal mr-2">Página {currentPage + 1} de {Math.ceil(storesAlerts.length / pageSize)}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(storesAlerts.length / pageSize) - 1, p + 1))}
                  disabled={currentPage >= Math.ceil(storesAlerts.length / pageSize) - 1}
                  className="p-1 rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
          {storesAlerts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {storesAlerts.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((item) => {
                const storeComp = item.tienda ? storeComplianceMap[item.tienda.id] : 0
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                        storeComp < 50 ? 'border-red-100 text-red-600 bg-red-50' : 
                        storeComp < 85 ? 'border-orange-100 text-orange-600 bg-orange-50' : 
                        'border-green-100 text-green-600 bg-green-50'
                      }`}>
                        {storeComp.toFixed(0)}%
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-orange transition-colors">{item.tienda?.sucursal || 'Sin Sucursal'}</h3>
                        <p className="text-sm text-gray-500">
                          Permiso: <span className="font-medium text-gray-700">{item.tipo_permiso?.nombre_permiso || 'Desconocido'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.tipo_alerta === 'Faltante' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.tipo_alerta}
                      </span>
                      <p className="text-xs text-gray-400 mt-1 font-medium tabular-nums">
                        {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : 'Carga pendiente'}
                      </p>
                    </div>
                  </div>
                )
              })}
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
