'use client'


import { InteractiveGridPattern } from "@promexma/ui";
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useUI } from '@/contexts/UIContext'
import { useAuth } from '@/contexts/AuthContext'
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useUI()
  const { perfil, rol, signOut } = useAuth()

  const bottomNavItems = buildMobileBottomNavItems(
    pathname,
    rol,
    () => setMobileNavOpen(true),
    mobileNavOpen,
  )

  return (
    <div className="min-h-screen app-canvas">
      <Sidebar />

      <div
        className={cn(
          'relative min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[250px]',
        )}
      >
                        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <InteractiveGridPattern
            cellSize={40}
            skewY={6}
            wave
            waveDuration={5}
            className="absolute inset-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,white,transparent)]"
            squaresClassName="stroke-slate-300/80"
          />
        </div>

        <header className="app-safe-x sticky top-0 z-30 flex items-center gap-3 bg-transparent py-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-slate-900">
              SO Permisos
            </h1>
            <p className="truncate text-xs text-slate-500">
              {perfil?.nombre_completo ?? '...'} · {rol ?? '...'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
  )
}
