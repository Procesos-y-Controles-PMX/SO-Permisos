'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ConfiguracionTabs from '@/components/configuracion/ConfiguracionTabs'
import { useAuth } from '@/contexts/AuthContext'

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAdmin, isOwnerAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 rounded-lg bg-muted-strong" />
        <div className="h-10 w-full max-w-md rounded-xl bg-muted-strong" />
        <div className="h-64 rounded-lg bg-muted-strong" />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <PageHeader
        eyebrow="Permisos"
        title="Configuración"
        subtitle={
          isOwnerAdmin
            ? "Usuarios, sucursales, catálogo de permisos y accesos."
            : "Usuarios, sucursales y catálogo de permisos."
        }
      />
      <ConfiguracionTabs />
      {children}
    </div>
  )
}
