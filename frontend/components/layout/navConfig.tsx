import { ReactNode } from 'react'
import type { MobileNavItem } from '@/components/layout/MobileBottomNav'

export interface NavItemDef {
  label: string
  href: string
  icon: ReactNode
  roles?: string[]
}

export interface NavGroup {
  title: string
  items: NavItemDef[]
}

export const permisosNavGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        roles: ['Admin', 'Regional'],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        ),
      },
      {
        label: 'Mi tienda',
        href: '/directorio',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        label: 'Solicitudes',
        href: '/solicitudes',
        roles: ['Admin'],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Descargas',
        href: '/descargas',
        roles: ['Admin'],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v11m0 0l-4-4m4 4l4-4m3 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2" />
          </svg>
        ),
      },
      {
        label: 'Historial',
        href: '/historial',
        roles: ['Tienda'],
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
]

export function filterNavByRole(rol: string | null) {
  return permisosNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles) return true
        return rol ? item.roles.includes(rol) : false
      }),
    }))
    .filter((group) => group.items.length > 0)
}

export const CONFIGURACION_HREF = '/configuracion/usuarios'

export const configuracionNavIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export function isConfiguracionNavActive(pathname: string) {
  return pathname === '/configuracion' || pathname.startsWith('/configuracion/')
}

export function isPermisosNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

const moreIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
)

const MOBILE_PRIMARY_SLOTS = 3

export function buildMobileBottomNavItems(
  pathname: string,
  rol: string | null,
  onMore: () => void,
  drawerOpen: boolean,
) {
  const flat = filterNavByRole(rol).flatMap((g) => g.items)
  const primary = flat.slice(0, MOBILE_PRIMARY_SLOTS)
  const overflow = flat.slice(MOBILE_PRIMARY_SLOTS)
  const overflowActive = overflow.some((item) => isPermisosNavActive(pathname, item.href))

  const items: MobileNavItem[] = primary.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: isPermisosNavActive(pathname, item.href),
  }))

  if (overflow.length > 0) {
    items.push({
      label: 'Más',
      href: '#more',
      icon: moreIcon,
      active: drawerOpen || overflowActive,
      onClick: onMore,
    })
  }

  return items
}
