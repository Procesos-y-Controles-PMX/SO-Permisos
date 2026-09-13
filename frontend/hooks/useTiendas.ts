'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { listTiendas } from '@/lib/api/tiendas'

interface UseTiendasReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTiendas(): UseTiendasReturn {
  const { perfil } = useAuth()
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
      setData(await listTiendas())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar tiendas')
    } finally {
      setLoading(false)
    }
  }, [perfil])

  useEffect(() => {
    if (perfil) void fetch()
  }, [perfil, fetch])

  return { data, loading, error, refetch: fetch }
}
