'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  aprobarSolicitud,
  createSolicitud as createSolicitudApi,
  listSolicitudes,
  rechazarSolicitud,
} from '@/lib/api/solicitudes'

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
    vigencia_propuesta: string | null
    archivo_adjunto_path: string | null
  }) => Promise<{ error: string | null }>
}

export function useSolicitudes(idTienda?: number): UseSolicitudesReturn {
  const { perfil } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSolicitudes = useCallback(async () => {
    if (!perfil) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      setData(await listSolicitudes(idTienda))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [perfil, idTienda])

  useEffect(() => {
    if (perfil) void fetchSolicitudes()
  }, [perfil, fetchSolicitudes])

  const aprobar = async (id: number, comentarios?: string) => {
    const result = await aprobarSolicitud(id, comentarios)
    if (!result.error) await fetchSolicitudes()
    return result
  }

  const rechazar = async (id: number, comentarios: string) => {
    const result = await rechazarSolicitud(id, comentarios)
    if (!result.error) await fetchSolicitudes()
    return result
  }

  const crearSolicitud = async (payload: {
    id_tienda: number
    id_tipo_permiso: number
    vigencia_propuesta: string | null
    archivo_adjunto_path: string | null
  }) => {
    const result = await createSolicitudApi(payload)
    if (!result.error) await fetchSolicitudes()
    return result
  }

  return { data, loading, error, refetch: fetchSolicitudes, aprobar, rechazar, crearSolicitud }
}
