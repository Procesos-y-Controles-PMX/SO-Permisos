'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UseNotificacionesReturn {
  data: any[]
  loading: boolean
  error: string | null
  unreadCount: number
  refetch: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

export function useNotificaciones(): UseNotificacionesReturn {
  const supabase = useMemo(() => createClient(), [])
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
      // Filter by perfil.id (Integer) — no RLS, explicit filter
      const { data: result, error: err } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('id_usuario', perfil.id)
        .order('fecha_creacion', { ascending: false })

      if (err) throw err
      setData(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil])

  useEffect(() => {
    if (perfil) fetch()
  }, [perfil, fetch])

  const unreadCount = data.filter(n => !n.leida).length

  const markAsRead = async (id: number) => {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)

    setData(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const markAllRead = async () => {
    const unreadIds = data.filter(n => !n.leida).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .in('id', unreadIds)

    setData(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return { data, loading, error, unreadCount, refetch: fetch, markAsRead, markAllRead }
}
