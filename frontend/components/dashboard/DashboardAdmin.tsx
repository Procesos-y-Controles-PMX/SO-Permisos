'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import PageHeader from '@/components/ui/PageHeader'
import { BTN_SECONDARY } from '@/components/ui/contentStyles'
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
    stores
  } = useDashboardStats()

  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  const sortedRegions = useMemo(() => {
    return [...regionalCounts].sort((a, b) => b.vencidos - a.vencidos)
  }, [regionalCounts])

  const sortedStores = useMemo(() => {
    return [...stores].sort((a, b) => {
      const compA = storeComplianceMap[a.id] || 0
      const compB = storeComplianceMap[b.id] || 0
      return compA - compB
    })
  }, [stores, storeComplianceMap])

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
    return <div className="m-8 rounded-sm border border-red-200 bg-red-50 p-8 text-red-600">Error al cargar dashboard: {error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <PageHeader
        eyebrow="Permisos"
        title="Dashboard General"
        subtitle="Visión global de cumplimiento normativo"
        actions={
          <Link href="/descargas" className={BTN_SECONDARY}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v11m0 0l-4-4m4 4l4-4m3 8v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2" />
            </svg>
            Descarga masiva
          </Link>
        }
      />

      <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="w-full min-w-[240px] rounded-sm bg-gradient-to-br from-brand to-brand-active p-6 text-white shadow-[0_2px_8px_-3px_rgba(237,28,36,.7)] md:w-auto">
            <p className="mb-1 text-sm font-medium text-white/80">Alertas de Cumplimiento</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
              <span className="mb-1.5 text-sm font-medium text-white/70">pendientes</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ProgressBar percentage={compliancePercentage} className="mb-2" />
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-steel" />
              Basado en {totalRequirements} requerimientos obligatorios totales
            </p>
          </div>
        </div>
      </div>

      {/* Regions Grid */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
          Alertas por Región
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sortedRegions.map((region) => (
            <div key={region.id} className="rounded-sm border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md">
              <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> Cumplimiento por Tienda
          </div>
          {sortedStores.length > pageSize && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-normal mr-2">Página {currentPage + 1} de {Math.ceil(sortedStores.length / pageSize)}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedStores.length / pageSize) - 1, p + 1))}
                  disabled={currentPage >= Math.ceil(sortedStores.length / pageSize) - 1}
                  className="p-1 rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
          {sortedStores.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {sortedStores.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((tienda) => {
                const storeComp = storeComplianceMap[tienda.id] || 0
                return (
                  <button 
                    key={tienda.id} 
                    onClick={() => router.push(`/directorio/${tienda.id}`)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${
                        storeComp < 50 ? 'border-red-100 text-red-600 bg-red-50' : 
                        storeComp < 85 ? 'border-orange-100 text-orange-600 bg-orange-50' : 
                        'border-green-100 text-green-600 bg-green-50'
                      }`}>
                        {storeComp.toFixed(0)}%
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{tienda.sucursal || 'Sin Sucursal'}</h3>
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          Región: {tienda.region?.nombre_region || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay sucursales configuradas para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
