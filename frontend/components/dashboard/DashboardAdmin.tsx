'use client'

import { useState } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { ProgressBar } from './ProgressBar'


export function DashboardAdmin() {
  const { 
    loading, 
    error, 
    totalAlertas, 
    totalRequirements, 
    compliancePercentage, 
    storeComplianceMap, 
    regionalCounts, 
    storesAlerts 
  } = useDashboardStats()

  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

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
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-linear-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/20 w-full md:w-auto min-w-[240px]">
            <p className="text-red-100 font-medium text-sm mb-1">Alertas de Cumplimiento</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
              <span className="text-red-200 mb-1.5 font-medium text-sm">pendientes</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ProgressBar percentage={compliancePercentage} className="mb-2" />
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Basado en {totalRequirements} requerimientos obligatorios totales
            </p>
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
              <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${region.vencidos > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {region.vencidos}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    ({region.cumplimiento.toFixed(1)}%)
                  </span>
                </div>
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
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> Tiendas con Incumplimientos
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
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.tienda?.sucursal || 'Sin Sucursal'}</h3>
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          Región: {item.tienda?.region?.nombre_region || 'N/A'} • {item.tipo_permiso?.nombre_permiso || 'Desconocido'}
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
                        {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : 'Pendiente carga'}
                      </p>
                    </div>
                  </div>
                )
              })}
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
