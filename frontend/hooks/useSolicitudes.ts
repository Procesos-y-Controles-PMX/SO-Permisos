'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UseSolicitudesReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  aprobar: (id: number, comentarios?: string) => Promise<{ error: string | null }>
  rechazar: (id: number, comentarios: string) => Promise<{ error: string | null }>
  crearSolicitud: (payload: {
    id_tienda: number
    id_tipo_permiso: number
    vigencia_propuesta: string
    archivo_adjunto_path: string | null
  }) => Promise<{ error: string | null }>
}

export function useSolicitudes(): UseSolicitudesReturn {
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isTienda, isRegional, isAdmin } = useAuth()
  const [data, setData] = useState<any[]>([])
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
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          tienda:id_tienda(id, sucursal),
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .order('fecha_solicitud', { ascending: false })

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

  // ─ Aprobar Solicitud ─
  const aprobar = async (id: number, comentarios?: string) => {
    try {
      const { error: err } = await supabase
        .from('solicitudes')
        .update({
          estatus_solicitud: 'Aprobado',
          comentarios_admin: comentarios || null,
          id_admin_revisor: perfil?.id ?? null, // Integer reference
        })
        .eq('id', id)

      if (err) throw err

      const solicitud = data.find(s => s.id === id)
      if (solicitud) {
        await supabase
          .from('permisos_vigentes')
          .upsert({
            id_tienda: solicitud.id_tienda,
            id_tipo_permiso: solicitud.id_tipo_permiso,
            fecha_vencimiento: solicitud.vigencia_propuesta,
            estatus: 'Vigente',
            archivo_path: solicitud.archivo_adjunto_path,
            puntaje: 1,
            ultima_actualizacion: new Date().toISOString(),
          }, {
            onConflict: 'id_tienda,id_tipo_permiso',
            ignoreDuplicates: false,
          })
      }

      await fetch()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  // ─ Rechazar Solicitud ─
  const rechazar = async (id: number, comentarios: string) => {
    try {
      const { error: err } = await supabase
        .from('solicitudes')
        .update({
          estatus_solicitud: 'Rechazado',
          comentarios_admin: comentarios,
          id_admin_revisor: perfil?.id ?? null, // Integer reference
        })
        .eq('id', id)

      if (err) throw err
      await fetch()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  // ─ Crear Solicitud ─
  const crearSolicitud = async (payload: {
    id_tienda: number
    id_tipo_permiso: number
    vigencia_propuesta: string
    archivo_adjunto_path: string | null
  }) => {
    try {
      const { error: err } = await supabase
        .from('solicitudes')
        .insert({
          ...payload,
          estatus_solicitud: 'Pendiente',
        })

      if (err) throw err
      await fetch()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  return { data, loading, error, refetch: fetch, aprobar, rechazar, crearSolicitud }
}
