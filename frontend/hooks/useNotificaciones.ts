'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listNotificaciones,
  markNotificacionRead,
  markNotificacionesRead,
} from '@/lib/api/notificaciones'

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
      setData(await listNotificaciones())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [perfil])

  useEffect(() => {
    if (perfil) void fetch()
  }, [perfil, fetch])

  const unreadCount = data.filter(n => !n.leida).length

  const markAsRead = async (id: number) => {
    await markNotificacionRead(id)
    setData(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const markAllRead = async () => {
    const unreadIds = data.filter(n => !n.leida).map(n => n.id)
    if (unreadIds.length === 0) return
    await markNotificacionesRead(unreadIds)
    setData(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return { data, loading, error, unreadCount, refetch: fetch, markAsRead, markAllRead }
}
