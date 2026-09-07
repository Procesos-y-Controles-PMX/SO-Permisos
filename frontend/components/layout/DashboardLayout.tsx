'use client'

import { NoiseField } from '@promexma/ui';
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useUI } from '@/contexts/UIContext'
import { useAuth } from '@/contexts/AuthContext'
import { isOwnerAdminEmail } from '@/lib/owner-admin'
import { AmbientGridProvider } from '@/contexts/AmbientGridContext'
import { cn } from '@/lib/utils'
import { buildMobileBottomNavItems } from '@/components/layout/navConfig'

import ModuleTransition from '@/components/common/ModuleTransition'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function AmbientCanvas({ animated }: { animated: boolean }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = resolvedTheme !== 'light'

  /* Everyone but the Administrador general gets a flat canvas instead. */
  if (!animated) {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[var(--ambient-flat)]"
        aria-hidden
      />
    )
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
      data-ambient-grid-clip
    >
      <NoiseField
        key={mounted ? resolvedTheme : 'light'}
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,white,transparent)]"
        color={isDark ? [255, 255, 255] : [52, 80, 122]}
        maxOpacity={isDark ? 0.5 : 0.7}
      />
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useUI()
  const { perfil, rol, signOut } = useAuth()
  const [meshReady, setMeshReady] = useState(false)

  /** Only the Administrador general gets the animated field; the rest get flat. */
  const ambientAnimated = isOwnerAdminEmail(perfil?.email)

  useEffect(() => {
    setMeshReady(true)
  }, [])

  const bottomNavItems = buildMobileBottomNavItems(
    pathname,
    rol,
    () => setMobileNavOpen(true),
    mobileNavOpen,
  )

  return (
    <AmbientGridProvider meshReady={meshReady} animated={ambientAnimated}>
      <div className="min-h-screen app-canvas">
        <Sidebar />

        <div
          className={cn(
            'relative min-h-screen transition-all duration-300',
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]',
          )}
        >
          <AmbientCanvas animated={ambientAnimated} />

          <header className="app-safe-x sticky top-0 z-30 flex items-center gap-3 bg-transparent pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:hidden">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold tracking-tight text-fg">
                SO Permisos
              </h1>
              <p className="truncate text-xs text-fg-subtle">
                {perfil?.nombre_completo ?? '...'} · {rol ?? '...'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-fg-subtle hover:bg-muted hover:text-fg-strong"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </header>

          <main className="relative z-10 app-safe-x app-safe-bottom app-main-pad mx-auto max-w-[1720px] overflow-x-hidden py-5 md:py-7">
            <ModuleTransition>{children}</ModuleTransition>
          </main>
        </div>

        <MobileBottomNav items={bottomNavItems} />
      </div>
    </AmbientGridProvider>
  )
}
