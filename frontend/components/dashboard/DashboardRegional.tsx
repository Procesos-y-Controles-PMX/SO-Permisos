'use client'

import { useState, useMemo } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useAuth } from '@/contexts/AuthContext'
import PageHeader from '@/components/ui/PageHeader'
import BrandLoader from '@/components/ui/BrandLoader'
import DashboardDetailSheet from '@/components/dashboard/DashboardDetailSheet'
import type { DashboardSheetTarget } from '@/components/dashboard/dashboardSheetUtils'
import { complianceBadgeClass } from '@/components/dashboard/dashboardSheetUtils'
import { ALERT_ERROR, SECTION_PANEL, SECTION_PANEL_HEADER } from '@/components/ui/contentStyles'
import GaugeStat, { GaugeStatRow, complianceTone } from '@/components/ui/GaugeStat'
import { cn } from '@/lib/utils'

export function DashboardRegional() {
  const {
    loading,
    error,
    totalAlertas,
    totalRequirements,
    compliancePercentage,
    storeComplianceMap,
    stores,
    storesAlerts,
  } = useDashboardStats()
  const { perfil } = useAuth()
  const [sheetTarget, setSheetTarget] = useState<DashboardSheetTarget | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  const sortedStores = useMemo(() => {
    return [...stores].sort((a, b) => {
      const compA = storeComplianceMap[a.id] || 0
      const compB = storeComplianceMap[b.id] || 0
      return compA - compB
    })
  }, [stores, storeComplianceMap])

  const regionName =
    perfil?.region?.nombre_region ||
    storesAlerts[0]?.tienda?.region?.nombre_region ||
    'Tu Zona'

  if (loading) {
    return (
      <BrandLoader
        center
        paddingClass="min-h-[50vh] py-8"
        label="Cargando datos de la región..."
      />
    )
  }

  if (error) {
    return <div className={`m-4 md:m-8 ${ALERT_ERROR}`}>Error: {error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
      <PageHeader
        eyebrow="Permisos"
        title={`Región ${regionName}`}
        subtitle="Gestión de cumplimiento por zona"
      />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
      <GaugeStatRow className="mb-2">
        <GaugeStat
          label="Alertas"
          value={totalAlertas}
          tone="crit"
          proportion={totalRequirements > 0 ? totalAlertas / totalRequirements : 0}
          sublabel="pendientes en la región"
          density="compact"
        />
        <GaugeStat
          label="Cumplimiento"
          value={compliancePercentage.toFixed(1)}
          unit="%"
          tone={complianceTone(compliancePercentage)}
          proportion={compliancePercentage / 100}
          sublabel={`${totalRequirements} requerimientos`}
          density="compact"
        />
        <GaugeStat
          label="Sucursales"
          value={stores.length}
          tone="steel"
          sublabel={regionName}
          density="compact"
        />
      </GaugeStatRow>
      </div>

      <section className={cn(SECTION_PANEL, 'animate-fade-up')} style={{ animationDelay: '120ms' }}>
        <div className={SECTION_PANEL_HEADER}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
            Cumplimiento por Tienda
          </h2>
          {sortedStores.length > pageSize ? (
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs font-normal text-slate-400">
                Página {currentPage + 1} de {Math.ceil(sortedStores.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="rounded-sm border border-slate-200 p-1 transition-colors hover:bg-slate-50 disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  type="button"
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
          ) : null}
        </div>
          {sortedStores.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {sortedStores
                .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                .map((tienda) => {
                  const storeComp = storeComplianceMap[tienda.id] || 0
                  return (
                    <button
                      key={tienda.id}
                      type="button"
                      onClick={() => setSheetTarget({ type: 'store', store: tienda })}
                      className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${complianceBadgeClass(storeComp)}`}
                        >
                          {storeComp.toFixed(0)}%
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-brand">
                            {tienda.sucursal || 'Sin Sucursal'}
                          </h3>
                          <p className="text-sm text-slate-500">Ir a detalle de la sucursal</p>
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
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">✓</div>
              </div>
              <h3 className="mb-1 text-lg font-medium text-slate-900">Sin sucursales por mostrar</h3>
              <p className="text-slate-500">No hay sucursales configuradas en esta región.</p>
            </div>
          )}
      </section>

      <DashboardDetailSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
        storesAlerts={storesAlerts}
        stores={stores}
        storeComplianceMap={storeComplianceMap}
      />
    </div>
  )
}
