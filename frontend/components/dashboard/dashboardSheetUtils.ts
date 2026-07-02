import type { RegionalCount, StoreAlertDetail, StoreSummary } from '@/hooks/useDashboardStats'

export function normalizeTienda<T extends { id?: number; id_region?: number; sucursal?: string }>(
  tienda: T | T[] | null | undefined,
): T | null {
  if (!tienda) return null
  return Array.isArray(tienda) ? (tienda[0] ?? null) : tienda
}

export function normalizePermiso<T extends { nombre_permiso?: string }>(
  permiso: T | T[] | null | undefined,
): T | null {
  if (!permiso) return null
  return Array.isArray(permiso) ? (permiso[0] ?? null) : permiso
}

export function alertsForRegion(alerts: StoreAlertDetail[], regionId: number) {
  return alerts.filter((alert) => normalizeTienda(alert.tienda)?.id_region === regionId)
}

export function alertsForStore(alerts: StoreAlertDetail[], storeId: number) {
  return alerts.filter((alert) => normalizeTienda(alert.tienda)?.id === storeId)
}

export function storesForRegion(stores: StoreSummary[], regionId: number) {
  return stores.filter((store) => store.id_region === regionId)
}

export function complianceBadgeClass(value: number) {
  if (value < 50) return 'border-red-100 bg-red-50 text-red-600'
  if (value < 85) return 'border-orange-100 bg-orange-50 text-orange-600'
  return 'border-green-100 bg-green-50 text-green-600'
}

export function formatAlertDate(date: string | null) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export type DashboardSheetTarget =
  | { type: 'region'; region: RegionalCount }
  | { type: 'store'; store: StoreSummary }
