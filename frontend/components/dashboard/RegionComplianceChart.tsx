'use client'

import type { RegionalCount } from '@/hooks/useDashboardStats'

function barColorClass(value: number) {
  if (value < 50) return 'bg-red-500'
  if (value < 85) return 'bg-amber-500'
  return 'bg-emerald-500'
}

interface RegionComplianceChartProps {
  regions: RegionalCount[]
  onSelect: (region: RegionalCount) => void
}

/** Gráfica de barras de % de cumplimiento por región (región abajo, barra clickeable). */
export default function RegionComplianceChart({ regions, onSelect }: RegionComplianceChartProps) {
  if (regions.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-fg-subtle">
        No hay regiones configuradas para mostrar.
      </div>
    )
  }

  return (
    <div className="p-4 pb-3 sm:p-5">
      <div className="flex items-end gap-2 sm:gap-3">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelect(region)}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
            title={`${region.nombre_region}: ${region.cumplimiento.toFixed(1)}% de cumplimiento · ${region.vencidos} alerta(s)`}
          >
            <span className="text-[11px] font-bold tabular-nums text-fg-strong">
              {region.cumplimiento.toFixed(0)}%
            </span>
            <div className="flex h-44 w-full items-end rounded-sm bg-muted-strong/80 px-1 pt-1.5 sm:h-52 sm:px-1.5 lg:h-60">
              <div
                className={`w-full rounded-t-sm transition-opacity group-hover:opacity-80 ${barColorClass(region.cumplimiento)}`}
                style={{ height: `${Math.max(region.cumplimiento, 2)}%` }}
              />
            </div>
            <span className="w-full truncate text-[10px] font-medium text-fg-muted transition-colors group-hover:text-brand sm:text-[11px]">
              {region.nombre_region}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
