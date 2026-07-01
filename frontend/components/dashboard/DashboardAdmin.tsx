'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import PageHeader from '@/components/ui/PageHeader'
import BrandLoader from '@/components/ui/BrandLoader'
import { ALERT_ERROR, BTN_SECONDARY, PANEL_CARD, STAT_TILE } from '@/components/ui/contentStyles'
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
    stores,
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
      <BrandLoader
        center
        paddingClass="min-h-[50vh] py-8"
        label="Analizando métricas globales..."
      />
    )
  }

  if (error) {
    return <div className={`m-4 md:m-8 ${ALERT_ERROR}`}>Error al cargar dashboard: {error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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

      <div className={`relative overflow-hidden p-6 md:p-8 ${PANEL_CARD}`}>
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="w-full min-w-[240px] rounded-sm bg-gradient-to-br from-brand to-brand-active p-6 text-white shadow-[0_2px_8px_-3px_rgba(237,28,36,.7)] md:w-auto">
            <p className="mb-1 text-sm font-medium text-white/80">Alertas de Cumplimiento</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black tabular-nums tracking-tighter">{totalAlertas}</span>
              <span className="mb-1.5 text-sm font-medium text-white/70">pendientes</span>
            </div>
          </div>

          <div className="w-full flex-1">
            <ProgressBar percentage={compliancePercentage} className="mb-2" />
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-steel" />
              Basado en {totalRequirements} requerimientos obligatorios totales
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
          Alertas por Región
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sortedRegions.map((region) => (
            <div key={region.id} className={`p-6 ${STAT_TILE}`}>
              <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
                {region.nombre_region}
              </p>
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${region.vencidos > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {region.vencidos}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                    ({region.cumplimiento.toFixed(1)}%)
                  </span>
                </div>
                {region.vencidos > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-red-500 text-red-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center justify-between text-xl font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
            Cumplimiento por Tienda
          </div>
          {sortedStores.length > pageSize && (
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs font-normal text-slate-400">
                Página {currentPage + 1} de {Math.ceil(sortedStores.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="rounded-sm border border-slate-200 p-1 transition-colors hover:bg-slate-50 disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(sortedStores.length / pageSize) - 1, p + 1),
                    )
                  }
                  disabled={currentPage >= Math.ceil(sortedStores.length / pageSize) - 1}
                  className="rounded-sm border border-slate-200 p-1 transition-colors hover:bg-slate-50 disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </h2>
        <div className={`overflow-hidden ${PANEL_CARD}`}>
          {sortedStores.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {sortedStores
                .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                .map((tienda) => {
                  const storeComp = storeComplianceMap[tienda.id] || 0
                  return (
                    <button
                      key={tienda.id}
                      onClick={() => router.push(`/directorio/${tienda.id}`)}
                      className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                            storeComp < 50
                              ? 'border-red-100 bg-red-50 text-red-600'
                              : storeComp < 85
                                ? 'border-orange-100 bg-orange-50 text-orange-600'
                                : 'border-green-100 bg-green-50 text-green-600'
                          }`}
                        >
                          {storeComp.toFixed(0)}%
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-brand">
                            {tienda.sucursal || 'Sin Sucursal'}
                          </h3>
                          <p className="max-w-md truncate text-sm text-slate-500">
                            Región: {tienda.region?.nombre_region || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-300 transition-colors group-hover:text-brand">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )
                })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No hay sucursales configuradas para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
