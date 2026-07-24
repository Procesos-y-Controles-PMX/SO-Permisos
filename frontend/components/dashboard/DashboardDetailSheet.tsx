'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import SheetModal from '@/components/ui/SheetModal'
import { BTN_PRIMARY, BTN_SECONDARY, EMPTY_STATE, PANEL_INSET } from '@/components/ui/contentStyles'
import GaugeStat, { GaugeStatRow, complianceTone } from '@/components/ui/GaugeStat'
import type { RegionalCount, StoreAlertDetail, StoreSummary } from '@/hooks/useDashboardStats'
import {
  alertsForRegion,
  alertsForStore,
  complianceBadgeClass,
  formatAlertDate,
  normalizePermiso,
  normalizeTienda,
  storesForRegion,
  type DashboardSheetTarget,
} from './dashboardSheetUtils'

interface DashboardDetailSheetProps {
  target: DashboardSheetTarget | null
  onClose: () => void
  storesAlerts: StoreAlertDetail[]
  stores: StoreSummary[]
  storeComplianceMap: Record<number, number>
  onSelectStore?: (store: StoreSummary) => void
}

function AlertRow({ alert }: { alert: StoreAlertDetail }) {
  const tienda = normalizeTienda(alert.tienda)
  const permiso = normalizePermiso(alert.tipo_permiso)
  const isMissing = alert.tipo_alerta === 'Faltante'

  return (
    <div className={`${PANEL_INSET} flex items-start gap-3 p-3`}>
      <span
        className={`mt-0.5 shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isMissing ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
        }`}
      >
        {alert.tipo_alerta}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{permiso?.nombre_permiso ?? 'Permiso'}</p>
        {tienda?.sucursal ? (
          <p className="mt-0.5 truncate text-xs text-fg-subtle">{tienda.sucursal}</p>
        ) : null}
        <p className="mt-1 text-xs text-fg-faint">Vence: {formatAlertDate(alert.fecha_vencimiento)}</p>
      </div>
    </div>
  )
}

function RegionSheetBody({
  region,
  storesAlerts,
  stores,
  storeComplianceMap,
  onSelectStore,
}: {
  region: RegionalCount
  storesAlerts: StoreAlertDetail[]
  stores: StoreSummary[]
  storeComplianceMap: Record<number, number>
  onSelectStore?: (store: StoreSummary) => void
}) {
  const regionStores = useMemo(
    () =>
      storesForRegion(stores, region.id).sort(
        (a, b) => (storeComplianceMap[a.id] ?? 0) - (storeComplianceMap[b.id] ?? 0),
      ),
    [stores, region.id, storeComplianceMap],
  )
  const regionAlerts = useMemo(() => alertsForRegion(storesAlerts, region.id), [storesAlerts, region.id])

  return (
    <div className="space-y-6">
      <GaugeStatRow>
        <GaugeStat
          label="Alertas"
          value={region.vencidos}
          tone={region.vencidos > 0 ? 'crit' : 'ok'}
          proportion={region.cumplimiento / 100}
          density="compact"
        />
        <GaugeStat
          label="Cumplimiento"
          value={region.cumplimiento.toFixed(1)}
          unit="%"
          tone={complianceTone(region.cumplimiento)}
          proportion={region.cumplimiento / 100}
          density="compact"
        />
      </GaugeStatRow>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-fg-subtle">
          Sucursales ({regionStores.length})
        </h3>
        {regionStores.length === 0 ? (
          <p className={EMPTY_STATE}>Sin sucursales en esta región.</p>
        ) : (
          <div className="space-y-2">
            {regionStores.map((store) => {
              const comp = storeComplianceMap[store.id] ?? 0
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => onSelectStore?.(store)}
                  className="flex w-full items-center gap-3 rounded-sm border border-line bg-card p-3 text-left transition-colors hover:border-brand/30 hover:bg-muted"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${complianceBadgeClass(comp)}`}
                  >
                    {comp.toFixed(0)}%
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium text-fg">
                    {store.sucursal || 'Sin sucursal'}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 text-fg-faint"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-fg-subtle">
          Alertas ({regionAlerts.length})
        </h3>
        {regionAlerts.length === 0 ? (
          <p className={`${EMPTY_STATE} py-8`}>Sin alertas pendientes en esta región.</p>
        ) : (
          <div className="max-h-[40vh] space-y-2 overflow-y-auto">
            {regionAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StoreSheetBody({
  store,
  storesAlerts,
  storeComplianceMap,
}: {
  store: StoreSummary
  storesAlerts: StoreAlertDetail[]
  storeComplianceMap: Record<number, number>
}) {
  const comp = storeComplianceMap[store.id] ?? 0
  const storeAlerts = useMemo(() => alertsForStore(storesAlerts, store.id), [storesAlerts, store.id])

  return (
    <div className="space-y-6">
      <GaugeStatRow>
        <GaugeStat
          label="Cumplimiento"
          value={comp.toFixed(1)}
          unit="%"
          tone={complianceTone(comp)}
          proportion={comp / 100}
          density="compact"
        />
        <GaugeStat
          label="Alertas"
          value={storeAlerts.length}
          tone={storeAlerts.length > 0 ? 'crit' : 'ok'}
          proportion={storeAlerts.length > 0 ? Math.min(1, storeAlerts.length / 10) : 0}
          sublabel={store.region?.nombre_region ?? 'N/A'}
          density="compact"
        />
      </GaugeStatRow>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-fg-subtle">
          Permisos con alerta
        </h3>
        {storeAlerts.length === 0 ? (
          <p className={`${EMPTY_STATE} py-8`}>Sin alertas pendientes para esta sucursal.</p>
        ) : (
          <div className="space-y-2">
            {storeAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function DashboardDetailSheet({
  target,
  onClose,
  storesAlerts,
  stores,
  storeComplianceMap,
  onSelectStore,
}: DashboardDetailSheetProps) {
  if (!target) return null

  const title =
    target.type === 'region'
      ? `Región ${target.region.nombre_region}`
      : target.store.sucursal || 'Sucursal'

  const footer =
    target.type === 'store' ? (
      <Link href={`/directorio/${target.store.id}`} className={BTN_PRIMARY}>
        Ver detalle completo
      </Link>
    ) : (
      <button type="button" onClick={onClose} className={BTN_SECONDARY}>
        Cerrar
      </button>
    )

  return (
    <SheetModal open title={title} onClose={onClose} footer={footer} maxWidth="max-w-2xl">
      {target.type === 'region' ? (
        <RegionSheetBody
          region={target.region}
          storesAlerts={storesAlerts}
          stores={stores}
          storeComplianceMap={storeComplianceMap}
          onSelectStore={onSelectStore}
        />
      ) : (
        <StoreSheetBody
          store={target.store}
          storesAlerts={storesAlerts}
          storeComplianceMap={storeComplianceMap}
        />
      )}
    </SheetModal>
  )
}
