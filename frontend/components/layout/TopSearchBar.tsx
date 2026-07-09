'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTiendas } from '@/hooks/useTiendas'
import { useAuth } from '@/contexts/AuthContext'
import { FIELD_INPUT, FIELD_SELECT_TRIGGER } from '@/components/ui/contentStyles'
import { AnimatedFilterDropdown, AnimatedFilterDropdownItem } from '@/components/common/AnimatedFilterDropdown'
import FilterSelect from '@/components/common/FilterSelect'

export default function TopSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, isRegional } = useAuth()
  const { data: tiendas } = useTiendas()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [filterRegion, setFilterRegion] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('topsearch_region_filter')
    if (saved) setFilterRegion(saved)
  }, [])

  const handleRegionChange = (val: string) => {
    setFilterRegion(val)
    sessionStorage.setItem('topsearch_region_filter', val)
  }

  const regionOptions = useMemo(() => {
    if (!isAdmin) return []
    return Array.from(new Set(tiendas.map((t: any) => t.region?.nombre_region).filter(Boolean))) as string[]
  }, [tiendas, isAdmin])

  const filtered = useMemo(() => {
    let result = tiendas

    if (filterRegion && isAdmin) {
      result = result.filter((t: any) => t.region?.nombre_region === filterRegion)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((t: any) => t.sucursal.toLowerCase().includes(q))
    }

    return result.slice(0, query.trim() ? 8 : 100)
  }, [query, tiendas, filterRegion, isAdmin])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (id: number) => {
    setQuery('')
    setOpen(false)
    router.push(`/directorio/${id}`)
  }

  const isStoreDetail = pathname.startsWith('/directorio/') && pathname !== '/directorio'
  if ((!isAdmin && !isRegional) || !isStoreDetail) return null

  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      {isAdmin && (
        <div className="w-64">
          <FilterSelect
            value={filterRegion}
            onChange={handleRegionChange}
            options={[
              { value: '', label: 'Todas las regiones' },
              ...regionOptions.map((r) => ({ value: r, label: r })),
            ]}
            inputClassName={`${FIELD_SELECT_TRIGGER} !min-h-0 py-2 text-xs md:text-xs`}
          />
        </div>
      )}

      <div ref={wrapperRef} className="relative w-full min-w-[240px] max-w-xs">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar tienda..."
            className={`pl-9 pr-4 text-[13px] ${FIELD_INPUT}`}
          />
        </div>

        <AnimatedFilterDropdown
          open={open && filtered.length > 0}
          maxHeightClass="max-h-80"
          className="custom-scrollbar"
        >
          {filtered.map((t) => (
            <AnimatedFilterDropdownItem key={t.id}>
              <button
                onClick={() => handleSelect(t.id)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand/5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-400 transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-700 transition-colors group-hover:text-brand">
                    {t.sucursal}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{t.region?.nombre_region ?? 'Sin región'}</p>
                </div>
              </button>
            </AnimatedFilterDropdownItem>
          ))}
        </AnimatedFilterDropdown>

        <AnimatedFilterDropdown open={open && !!query.trim() && filtered.length === 0}>
          <div className="p-4 text-center">
            <p className="text-[12px] text-slate-400">No se encontraron tiendas</p>
          </div>
        </AnimatedFilterDropdown>
      </div>
    </div>
  )
}
