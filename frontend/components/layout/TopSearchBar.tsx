'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTiendas } from '@/hooks/useTiendas'
import { useAuth } from '@/contexts/AuthContext'

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
    } else if (isAdmin && !filterRegion) {
      // Si está vacío y no hay filtro en Admin, tal vez no mostramos nada, 
      // pero el requerimiento dice que muestre si hay región seleccionada. 
      // Para Regional (o admin filtrado) mostramos vacío hasta 8
    }

    // Return up to 100 results if no query is typed, to show all regional stores
    return result.slice(0, query.trim() ? 8 : 100)
  }, [query, tiendas, filterRegion, isAdmin])

  // Close dropdown on outside click
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

  // Check visibility conditions
  const isStoreDetail = pathname.startsWith('/directorio/') && pathname !== '/directorio'
  if ((!isAdmin && !isRegional) || !isStoreDetail) return null

  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      {isAdmin && (
        <select
          value={filterRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="px-3 py-2 text-[12px] bg-white border border-gray-200 rounded-xl text-gray-700
            focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400
            transition-all shadow-sm w-64 cursor-pointer"
        >
          <option value="">Todas las regiones</option>
          {regionOptions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}

      <div ref={wrapperRef} className="relative w-full min-w-[240px] max-w-xs">
      {/* Search input */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
          className="w-full pl-9 pr-4 py-2 text-[13px] bg-white/80 backdrop-blur-sm border border-gray-200 
            rounded-xl text-gray-700 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400
            transition-all duration-200 shadow-sm"
        />
      </div>

      {/* Dropdown results */}
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg
          overflow-y-auto max-h-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50/60 transition-colors flex items-center gap-3 group"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-red-100 text-gray-400 group-hover:text-red-500
                flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-700 group-hover:text-red-600 transition-colors truncate">
                  {t.sucursal}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{t.region?.nombre_region ?? 'Sin región'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg
          overflow-hidden z-50 p-4 text-center">
          <p className="text-[12px] text-gray-400">No se encontraron tiendas</p>
        </div>
      )}
      </div>
    </div>
  )
}
