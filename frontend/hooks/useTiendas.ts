'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UseTiendasReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTiendas(): UseTiendasReturn {
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isAdmin, isRegional, isTienda } = useAuth()
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
        .from('tiendas')
        .select('*, region:id_region(id, nombre_region, gerente_regional, celular, correo)')
        .order('sucursal')

      // RLS handles security, but we also filter client-side for UX
      if (isTienda && perfil.id_tienda) {
        query = query.eq('id', perfil.id_tienda)
      } else if (isRegional && perfil.id_region) {
        query = query.eq('id_region', perfil.id_region)
      }
      // Admin: no filter needed

      const { data: result, error: err } = await query
      if (err) throw err
      setData(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil, isAdmin, isRegional, isTienda])

  useEffect(() => {
    if (perfil) fetch()
  }, [perfil, fetch])

  return { data, loading, error, refetch: fetch }
}
