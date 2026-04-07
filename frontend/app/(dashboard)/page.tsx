'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin'
import { DashboardRegional } from '@/components/dashboard/DashboardRegional'

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
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Cargando Dashboard...</p>
        </div>
      </div>
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
