'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ConfiguracionPage() {
  const router = useRouter()
  const { isAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAdmin) {
      router.replace('/directorio')
      return
    }
    router.replace('/configuracion/usuarios')
  }, [loading, isAdmin, router])

  return null
}
