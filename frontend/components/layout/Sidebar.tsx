'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// ── Navigation Definition ──────────────────────────────────

interface NavItemDef {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[] // If undefined, visible to all roles
}

interface NavGroup {
  title: string
  items: NavItemDef[]
}

const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        label: 'Directorio',
        href: '/directorio',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        label: 'Permisos',
        href: '/permisos',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: 'Solicitudes',
        href: '/solicitudes',
        roles: ['Admin', 'Tienda'], // Regional is read-only, hide review panel
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Notificaciones',
        href: '/notificaciones',
        roles: ['Admin', 'Tienda'],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
    ],
  },
]

// ── Component ──────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const { perfil, rol, signOut, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Filter nav items by role
  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.roles) return true
      return rol ? item.roles.includes(rol) : false
    }),
  })).filter((group) => group.items.length > 0)

  // User initials
  const initials = perfil?.nombre_completo
    ? perfil.nombre_completo
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  const displayName = perfil?.nombre_completo || 'Cargando...'
  const displayRole = rol || '...'

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100
        flex flex-col transition-all duration-300 ease-in-out shadow-sm
        ${collapsed ? 'w-[72px]' : 'w-[250px]'}
      `}
    >
      {/* ── Header: Logo + Collapse ── */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/circulo-promexma.png"
            alt="Promexma"
            width={30}
            height={30}
            className="shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-none">Promexma</p>
              <p className="text-[10px] text-blue-500 font-medium mt-0.5">SO Permisos</p>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center
            text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                {group.title}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`
                      flex items-center gap-3 rounded-xl text-[13px] font-medium
                      transition-all duration-200 relative
                      ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'}
                      ${active
                        ? 'bg-red-50 text-red-600'
                        : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'
                      }
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="border-t border-gray-100 px-3 py-3 shrink-0">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Usuario</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400">{displayRole}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
