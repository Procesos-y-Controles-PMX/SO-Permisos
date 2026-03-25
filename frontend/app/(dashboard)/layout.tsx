'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
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

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Not logged in — will redirect
  if (!perfil) return null

  return <DashboardLayout>{children}</DashboardLayout>
}
