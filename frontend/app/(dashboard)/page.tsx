'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin'
import { DashboardRegional } from '@/components/dashboard/DashboardRegional'
import BrandLoader from '@/components/ui/BrandLoader'

export default function DashboardRootPage() {
  const { isTienda, isAdmin, isRegional, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isTienda) {
      router.push('/directorio')
    }
  }, [loading, isTienda, router])

  if (loading || isTienda) {
    return (
      <BrandLoader
        center
        size="lg"
        paddingClass="min-h-[50vh] py-8"
        label="Cargando Dashboard..."
      />
    )
  }

  if (isAdmin) {
    return <DashboardAdmin />
  }

  if (isRegional) {
    return <DashboardRegional />
  }

  return (
    <div className="p-8 text-center text-gray-500">
      Rol no autorizado para ver esta sección.
    </div>
  )
}
