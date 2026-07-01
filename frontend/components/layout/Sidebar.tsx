'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUI } from '@/contexts/UIContext'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_IDLE,
  SIDEBAR_SECTION_LABEL,
  SIDEBAR_SHELL,
  SIDEBAR_USER_CARD,
} from '@/components/layout/shellStyles'
import { filterNavByRole, isPermisosNavActive } from '@/components/layout/navConfig'

function SidebarPanel({
  collapsed,
  onNavigate,
  onToggleCollapse,
  showCollapse,
}: {
  collapsed: boolean
  onNavigate?: () => void
  onToggleCollapse?: () => void
  showCollapse?: boolean
}) {
  const pathname = usePathname()
  const { perfil, rol, signOut } = useAuth()

  const filteredGroups = filterNavByRole(rol)

  const initials = perfil?.nombre_completo
    ? perfil.nombre_completo
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <>
      <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Link href="/directorio" className="flex items-center gap-2.5 overflow-hidden" onClick={onNavigate}>
          <Image src="/circulo-promexma.png" alt="Promexma" width={30} height={30} className="shrink-0 rounded-full" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-white">Promexma</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">SO Permisos</p>
            </div>
          )}
        </Link>
        {showCollapse && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-slate-400 transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn('h-3.5 w-3.5 transition-transform duration-300', collapsed && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <div className="mb-2 flex items-center gap-2 px-3">
                <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <p className={SIDEBAR_SECTION_LABEL}>{group.title}</p>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isPermisosNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={onNavigate}
                    className={cn(
                      'relative flex items-center gap-3 rounded-sm text-[13px] font-medium transition-all duration-200',
                      collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5',
                      active ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE,
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('mx-3 mb-3 shrink-0 border-t border-white/10 pt-3', SIDEBAR_USER_CARD)}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Usuario</p>
                <p className="truncate text-xs font-semibold text-slate-200">{perfil?.nombre_completo || 'Cargando...'}</p>
                <p className="text-[10px] text-slate-500">{rol || '...'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate?.()
                  signOut()
                }}
                className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                title="Cerrar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useUI()

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex w-[min(280px,88vw)] flex-col shadow-xl transition-transform duration-300 ease-in-out lg:hidden',
          SIDEBAR_SHELL,
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-end border-b border-white/10 px-3 py-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-200"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarPanel collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden shadow-lg transition-all duration-300 ease-in-out lg:flex lg:flex-col',
          SIDEBAR_SHELL,
          sidebarCollapsed ? 'w-[72px]' : 'w-[250px]',
        )}
      >
        <SidebarPanel
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          showCollapse
        />
      </aside>
    </>
  )
}
