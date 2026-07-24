'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { GridLoadingScreen } from '@promexma/ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { perfil, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !perfil) {
      router.push('/login')
    }
  }, [perfil, loading, router])

  if (loading) {
    return <GridLoadingScreen message="Verificando sesión..." variant="dark" />
  }

  // Not logged in — will redirect
  if (!perfil) return null

  return <DashboardLayout>{children}</DashboardLayout>
}
