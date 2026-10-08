'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardStats } from '@/lib/api/dashboard'
import type { RegionalCount, StoreAlertDetail, StoreSummary } from '@/lib/api/dashboard'

export type { RegionalCount, StoreAlertDetail, StoreSummary }

export function useDashboardStats() {
  const { perfil, isAdmin, isRegional } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalAlertas, setTotalAlertas] = useState(0)
  const [totalRequirements, setTotalRequirements] = useState(0)
  const [compliancePercentage, setCompliancePercentage] = useState(0)
  const [storeComplianceMap, setStoreComplianceMap] = useState<Record<number, number>>({})
  const [regionalCounts, setRegionalCounts] = useState<RegionalCount[]>([])
  const [storesAlerts, setStoresAlerts] = useState<StoreAlertDetail[]>([])
  const [stores, setStores] = useState<StoreSummary[]>([])

  const fetchStats = useCallback(async () => {
    if (!perfil) return
    if (!isAdmin && !isRegional) return

    setLoading(true)
    setError(null)

    try {
      const stats = await getDashboardStats()
      setTotalAlertas(stats.totalAlertas)
      setTotalRequirements(stats.totalRequirements)
      setCompliancePercentage(stats.compliancePercentage)
      setStoreComplianceMap(stats.storeComplianceMap)
      setRegionalCounts(stats.regionalCounts)
      setStoresAlerts(stats.storesAlerts)
      setStores(stats.stores)
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Error al cargar métricas')
    } finally {
      setLoading(false)
    }
  }, [perfil, isAdmin, isRegional])

  useEffect(() => {
    if (perfil) void fetchStats()
  }, [perfil, fetchStats])

  return {
    totalAlertas,
    totalRequirements,
    compliancePercentage,
    storeComplianceMap,
    regionalCounts,
    storesAlerts,
    stores,
    loading,
    error,
    refetch: fetchStats
  }
}
