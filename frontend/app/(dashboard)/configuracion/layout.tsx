'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ConfiguracionTabs from '@/components/configuracion/ConfiguracionTabs'
import { useAuth } from '@/contexts/AuthContext'

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 rounded-lg bg-slate-100" />
        <div className="h-10 w-full max-w-md rounded-xl bg-slate-100" />
        <div className="h-64 rounded-lg bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <PageHeader
        eyebrow="Permisos"
        title="Configuración"
        subtitle="Administración de usuarios, sucursales y catálogo de permisos."
      />
      <ConfiguracionTabs />
      {children}
    </div>
  )
}
