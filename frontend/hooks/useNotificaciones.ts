'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const supabase = createClient()
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // RLS ensures only own notifications are returned
      const { data: result, error: err } = await supabase
        .from('notificaciones')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (err) throw err
      setData(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    if (user) fetch()
  }, [user, fetch])

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
