'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

export function useStoreCompliance() {
  const supabase = useMemo(() => createClient(), [])
  const ACTIVE_STATUSES = new Set(['Activo', 'Aprobado'])
  const [storeComplianceMap, setStoreComplianceMap] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuracion_tienda_permisos')
        .select(`
          id_tienda,
          obligatorio,
          permiso_vigente:permisos_vigentes(id, estatus)
        `)
        .eq('obligatorio', true)

      if (error) throw error

      const rawData = data || []
      const storeMap: Record<number, { total: number; alerts: number }> = {}

      rawData.forEach((item: any) => {
        const tid = item.id_tienda
        if (!storeMap[tid]) storeMap[tid] = { total: 0, alerts: 0 }
        storeMap[tid].total++

        const vigente = Array.isArray(item.permiso_vigente) ? item.permiso_vigente[0] : item.permiso_vigente
        
        let isAlert = false
        if (!vigente) {
          isAlert = true
        } else if (!ACTIVE_STATUSES.has(vigente.estatus)) {
          isAlert = true
        }

        if (isAlert) {
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
    } catch (e) {
      console.error('Error fetching store compliance:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { storeComplianceMap, loading, refetch: fetchStats }
}
