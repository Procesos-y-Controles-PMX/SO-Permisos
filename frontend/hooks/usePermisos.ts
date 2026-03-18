'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PermisoVigente } from '@/types'

interface UsePermisosReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  // Computed stats
  stats: {
    total: number
    vigentes: number
    vencidos: number
    porVencer: number
    cumplimiento: number
  }
}

export function usePermisos(): UsePermisosReturn {
  const supabase = createClient()
  const { perfil, isTienda, isRegional } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!perfil) return
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('permisos_vigentes')
        .select(`
          *,
          tiendas:id_tienda(id, sucursal, id_region),
          catalogo_permisos:id_tipo_permiso(id, nombre_permiso, ponderacion)
        `)
        .order('fecha_vencimiento', { ascending: true })

      if (isTienda && perfil.id_tienda) {
        query = query.eq('id_tienda', perfil.id_tienda)
      } else if (isRegional && perfil.id_region) {
        // Get tienda IDs for this region first
        const { data: tiendasRegion } = await supabase
          .from('tiendas')
          .select('id')
          .eq('id_region', perfil.id_region)

        if (tiendasRegion && tiendasRegion.length > 0) {
          query = query.in('id_tienda', tiendasRegion.map(t => t.id))
        }
      }

      const { data: result, error: err } = await query
      if (err) throw err
      setData(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil, isTienda, isRegional])

  useEffect(() => {
    if (perfil) fetch()
  }, [perfil, fetch])

  // Compute stats
  const total = data.length
  const vigentes = data.filter(p => p.estatus === 'Vigente').length
  const vencidos = data.filter(p => p.estatus === 'Vencido').length
  const porVencer = data.filter(p => p.estatus === 'Por Vencer').length
  const cumplimiento = total > 0 ? Math.round((vigentes / total) * 1000) / 10 : 0

  return {
    data,
    loading,
    error,
    refetch: fetch,
    stats: { total, vigentes, vencidos, porVencer, cumplimiento },
  }
}
