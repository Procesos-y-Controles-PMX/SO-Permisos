'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface RegionalCount {
  id: number
  nombre_region: string
  vencidos: number
  cumplimiento: number
}

export interface StoreAlertDetail {
  id: number
  tipo_alerta: 'Faltante' | 'Vencido'
  fecha_vencimiento: string | null
  tienda: {
    id: number
    sucursal: string
    id_region: number
    region: {
      nombre_region: string
    } | null
  } | null
  tipo_permiso: {
    id: number
    nombre_permiso: string
  } | null
}

export interface StoreSummary {
  id: number
  sucursal: string
  id_region: number
  region: {
    nombre_region: string
  } | null
}

export function useDashboardStats() {
  const supabase = useMemo(() => createClient(), [])
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
  const ACTIVE_STATUSES = new Set(['Activo', 'Aprobado'])

  const fetchStats = useCallback(async () => {
    if (!perfil) return
    if (!isAdmin && !isRegional) return

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch ALL mandatory configurations for the current context (Admin: All, Regional: Their region)
      let query = supabase
        .from('configuracion_tienda_permisos')
        .select(`
          id,
          id_tienda,
          obligatorio,
          tienda:id_tienda!inner(id, sucursal, id_region, region:id_region(id, nombre_region)),
          tipo_permiso:id_tipo_permiso(id, nombre_permiso),
          permiso_vigente:permisos_vigentes(id, estatus, fecha_vencimiento)
        `)
        .eq('obligatorio', true)

      if (isRegional && perfil.id_region) {
        query = query.eq('tienda.id_region', perfil.id_region)
      }

      const { data, error: err } = await query
      if (err) throw err

      const rawData = data || []
      setTotalRequirements(rawData.length)

      // 2. Build full store list from mandatory requirements
      const allStoresMap = new Map<number, StoreSummary>()
      rawData.forEach((item: any) => {
        const tienda = Array.isArray(item.tienda) ? item.tienda[0] : item.tienda
        if (tienda?.id && !allStoresMap.has(tienda.id)) {
          allStoresMap.set(tienda.id, tienda)
        }
      })
      setStores(Array.from(allStoresMap.values()))

      // 3. Identify Alerts in memory (Missing or Expired)
      const allAlertsRaw = rawData.map((item: any) => {
        const vigente = Array.isArray(item.permiso_vigente) ? item.permiso_vigente[0] : item.permiso_vigente
        const isExpiredByDate = Boolean(
          vigente?.fecha_vencimiento &&
          new Date(vigente.fecha_vencimiento).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
        )

        let tipo_alerta: 'Faltante' | 'Vencido' | null = null
        if (!vigente) {
          tipo_alerta = 'Faltante'
        } else if (!ACTIVE_STATUSES.has(vigente.estatus) || isExpiredByDate) {
          tipo_alerta = 'Vencido'
        }

        if (tipo_alerta) {
          return {
            id: item.id,
            tipo_alerta,
            fecha_vencimiento: vigente?.fecha_vencimiento || null,
            tienda: item.tienda,
            tipo_permiso: item.tipo_permiso
          } as StoreAlertDetail
        }
        return null
      }).filter(Boolean) as StoreAlertDetail[]

      setTotalAlertas(allAlertsRaw.length)
      setStoresAlerts(allAlertsRaw)

      // 4. Global Compliance %
      const globalCompliance = rawData.length > 0 
        ? Math.round(((rawData.length - allAlertsRaw.length) / rawData.length) * 1000) / 10 
        : 0
      setCompliancePercentage(globalCompliance)

      // 5. Per Store Compliance %
      const storeMap: Record<number, { total: number; alerts: number }> = {}
      rawData.forEach((item: any) => {
        const tid = item.id_tienda
        if (!storeMap[tid]) storeMap[tid] = { total: 0, alerts: 0 }
        storeMap[tid].total++
      })
      allAlertsRaw.forEach((alert) => {
        const tid = alert.tienda?.id
        if (tid && storeMap[tid]) {
          storeMap[tid].alerts++
        }
      })
      
      const finalStoreCompliance: Record<number, number> = {}
      Object.keys(storeMap).forEach((tid) => {
        const id = Number(tid)
        const s = storeMap[id]
        finalStoreCompliance[id] = s.total > 0 
          ? Math.round(((s.total - s.alerts) / s.total) * 1000) / 10 
          : 0
      })
      setStoreComplianceMap(finalStoreCompliance)

      // 6. Regional Counts (Admin only)
      if (isAdmin) {
        const { data: regiones } = await supabase.from('regiones').select('id, nombre_region').order('nombre_region')
        if (regiones) {
          const counts = regiones.map(reg => {
            const regReqs = rawData.filter(r => {
              const t = Array.isArray(r.tienda) ? r.tienda[0] : r.tienda
              return t?.id_region === reg.id
            }).length
            
            const regAlerts = allAlertsRaw.filter(a => {
              const t = Array.isArray(a.tienda) ? a.tienda[0] : a.tienda
              return t?.id_region === reg.id
            }).length
            
            return {
              id: reg.id,
              nombre_region: reg.nombre_region,
              vencidos: regAlerts,
              cumplimiento: regReqs > 0 ? Math.round(((regReqs - regAlerts) / regReqs) * 1000) / 10 : 0
            }
          })
          setRegionalCounts(counts)
        }
      }

    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil, isAdmin, isRegional])

  useEffect(() => {
    if (perfil) fetchStats()
  }, [perfil, fetchStats])

  // Real-time synchronization
  useEffect(() => {
    if (!isAdmin && !isRegional) return

    const channel = supabase.channel('dashboard-compliance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permisos_vigentes' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion_tienda_permisos' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tiendas' }, fetchStats)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin, isRegional, fetchStats])

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
