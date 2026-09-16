'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { listPermisos } from '@/lib/api/permisos'
import type { ConfiguracionTiendaPermiso } from '@/types'

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
  const { perfil } = useAuth()
  const [data, setData] = useState<ConfiguracionTiendaPermiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ACTIVE_STATUSES = new Set(['Activo', 'Aprobado'])

  const fetch = useCallback(async () => {
    if (!perfil) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      setData(await listPermisos())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar permisos')
    } finally {
      setLoading(false)
    }
  }, [perfil])

  useEffect(() => {
    if (perfil) void fetch()
  }, [perfil, fetch])

  const total = data.length
  const vigentes = data.filter(p => p.permiso_vigente?.estatus && ACTIVE_STATUSES.has(p.permiso_vigente.estatus)).length
  const vencidos = data.filter(p => p.permiso_vigente?.estatus === 'Vencido').length
  const porVencer = 0
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
