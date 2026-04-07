'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface RegionalCount {
  id: number
  nombre_region: string
  vencidos: number
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

export function useDashboardStats() {
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isAdmin, isRegional } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalAlertas, setTotalAlertas] = useState(0)
  const [regionalCounts, setRegionalCounts] = useState<RegionalCount[]>([])
  const [storesAlerts, setStoresAlerts] = useState<StoreAlertDetail[]>([])

  const fetchStats = useCallback(async () => {
    if (!perfil) return
    if (!isAdmin && !isRegional) return

    setLoading(true)
    setError(null)

    try {
      // Base query logic to find all alerts (Missing Mandatory or Expired)
      // Logic: configuracion_tienda_permisos.obligatorio = true
      // AND (permisos_vigentes IS NULL OR permisos_vigentes.estatus = 'Vencido')
      
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

      // Since Supabase join filters for NULL is tricky locally, we filter in memory
      // to correctly identify 'Faltante' vs 'Vencido'
      const allAlertsRaw = (data || []).map((item: any) => {
        const vigente = Array.isArray(item.permiso_vigente) ? item.permiso_vigente[0] : item.permiso_vigente
        
        let tipo_alerta: 'Faltante' | 'Vencido' | null = null
        if (!vigente) {
          tipo_alerta = 'Faltante'
        } else if (vigente.estatus === 'Vencido') {
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

      // Calculate Regional Counts (only for Admin)
      if (isAdmin) {
        const { data: regiones } = await supabase.from('regiones').select('id, nombre_region').order('nombre_region')
        if (regiones) {
          const counts = regiones.map(reg => ({
            id: reg.id,
            nombre_region: reg.nombre_region,
            vencidos: allAlertsRaw.filter(a => a.tienda?.id_region === reg.id).length
          }))
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin, isRegional, fetchStats])

  return {
    totalVencidos: totalAlertas, // Maintain key name if possible or update components
    totalAlertas,
    regionalCounts,
    storesExpired: storesAlerts, // Maintain key name or update
    storesAlerts,
    loading,
    error,
    refetch: fetchStats
  }
}
