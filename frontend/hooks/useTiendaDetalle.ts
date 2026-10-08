'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConfiguracionTiendaPermiso } from '@/types'
import { getTiendaDetalle } from '@/lib/api/tienda-detalle'

interface UseTiendaDetalleReturn {
  tienda: any | null
  permisos: ConfiguracionTiendaPermiso[]
  solicitudes: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTiendaDetalle(idTienda: number | null): UseTiendaDetalleReturn {
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
      const result = await getTiendaDetalle(idTienda)
      setTienda(result.tienda)
      setPermisos(result.permisos)
      setSolicitudes(result.solicitudes)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el detalle')
    } finally {
      setLoading(false)
    }
  }, [idTienda])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { tienda, permisos, solicitudes, loading, error, refetch: fetch }
}
