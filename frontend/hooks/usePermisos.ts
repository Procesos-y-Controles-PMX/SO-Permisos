'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ConfiguracionTiendaPermiso, EstatusPermiso } from '@/types'

interface UsePermisosReturn {
  data: ConfiguracionTiendaPermiso[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  stats: {
    total: number
    vigentes: number
    vencidos: number
    porVencer: number
    noSubidos: number
    cumplimiento: number
  }
}

export function usePermisos(): UsePermisosReturn {
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isTienda, isRegional } = useAuth()
  const [data, setData] = useState<ConfiguracionTiendaPermiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!perfil) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      // BASE QUERY: configuracion_tienda_permisos
      // Join with permissions catalog and current status (permisos_vigentes)
      let query = supabase
        .from('configuracion_tienda_permisos')
        .select(`
          *,
          tienda:id_tienda(id, sucursal, id_region),
          tipo_permiso:id_tipo_permiso(id, nombre_permiso, ponderacion),
          permiso_vigente:permisos_vigentes(
            id,
            fecha_vencimiento,
            estatus,
            archivo_path,
            puntaje,
            comentarios,
            ultima_actualizacion
          )
        `)
        .order('id_tienda', { ascending: true })

      if (isTienda && perfil.id_tienda) {
        query = query.eq('id_tienda', perfil.id_tienda)
      } else if (isRegional && perfil.id_region) {
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

      // Since permisos_vigentes is a join, Supabase might return it as an array
      // even if there's only one. We transform it to a single object for convenience.
      const transformed = (result || []).map((item: any) => ({
        ...item,
        permiso_vigente: Array.isArray(item.permiso_vigente) 
          ? item.permiso_vigente[0] 
          : item.permiso_vigente
      }))

      setData(transformed as ConfiguracionTiendaPermiso[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil, isTienda, isRegional])

  useEffect(() => {
    if (perfil) fetch()
  }, [perfil, fetch])

  // Compute stats based on required vs status
  const total = data.length
  const vigentes = data.filter(p => p.permiso_vigente?.estatus === 'Vigente').length
  const vencidos = data.filter(p => p.permiso_vigente?.estatus === 'Vencido').length
  const porVencer = data.filter(p => p.permiso_vigente?.estatus === 'Por Vencer').length
  const noSubidos = data.filter(p => !p.permiso_vigente).length
  
  const cumplimiento = total > 0 ? Math.round((vigentes / total) * 1000) / 10 : 0

  return {
    data,
    loading,
    error,
    refetch: fetch,
    stats: { total, vigentes, vencidos, porVencer, noSubidos, cumplimiento },
  }
}
