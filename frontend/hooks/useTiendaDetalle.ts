'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { ConfiguracionTiendaPermiso } from '@/types'

interface UseTiendaDetalleReturn {
  tienda: any | null
  permisos: ConfiguracionTiendaPermiso[]
  solicitudes: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTiendaDetalle(idTienda: number | null): UseTiendaDetalleReturn {
  const supabase = useMemo(() => createClient(), [])
  const [tienda, setTienda] = useState<any | null>(null)
  const [permisos, setPermisos] = useState<ConfiguracionTiendaPermiso[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idTienda) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Query 1: Tienda info with region join
      const { data: tiendaData, error: tiendaErr } = await supabase
        .from('tiendas')
        .select('*, region:id_region(id, nombre_region, gerente_regional, celular, correo)')
        .eq('id', idTienda)
        .single()

      if (tiendaErr) throw tiendaErr
      setTienda(tiendaData)

      // Query 2: configuracion_tienda_permisos + LEFT JOIN permisos_vigentes
      const { data: permisosData, error: permisosErr } = await supabase
        .from('configuracion_tienda_permisos')
        .select(`
          *,
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
        .eq('id_tienda', idTienda)
        .order('id', { ascending: true })

      if (permisosErr) throw permisosErr

      // Normalize permiso_vigente from array to single object
      const transformedPermisos = (permisosData || []).map((item: any) => ({
        ...item,
        permiso_vigente: Array.isArray(item.permiso_vigente)
          ? item.permiso_vigente[0] || null
          : item.permiso_vigente,
      }))
      setPermisos(transformedPermisos as ConfiguracionTiendaPermiso[])

      // Query 3: Solicitudes for this tienda (with comentarios_admin)
      const { data: solicitudesData, error: solicitudesErr } = await supabase
        .from('solicitudes')
        .select(`
          *,
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .eq('id_tienda', idTienda)
        .order('fecha_solicitud', { ascending: false })

      if (solicitudesErr) throw solicitudesErr
      setSolicitudes(solicitudesData || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, idTienda])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { tienda, permisos, solicitudes, loading, error, refetch: fetch }
}
