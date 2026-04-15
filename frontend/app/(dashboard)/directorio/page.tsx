'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { useTiendas } from '@/hooks/useTiendas'
import { useStoreCompliance } from '@/hooks/useStoreCompliance'
import { useAuth } from '@/contexts/AuthContext'

// ── Component ──────────────────────────────────────────────

export default function DirectorioPage() {
  const router = useRouter()
  const { data: tiendas, loading, error } = useTiendas()
  const { storeComplianceMap, loading: loadingCompliance } = useStoreCompliance()
  const { perfil, isTienda, isRegional } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [filterRegion, setFilterRegion] = useState('')

  // Load saved region filter
  useEffect(() => {
    const saved = sessionStorage.getItem('directorio_region_filter')
    if (saved) setFilterRegion(saved)
  }, [])

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setFilterRegion(val)
    sessionStorage.setItem('directorio_region_filter', val)
  }

  // Auto-redirect: Tienda users go straight to their store detail
  useEffect(() => {
    if (!loading && isTienda && perfil?.id_tienda) {
      router.replace(`/directorio/${perfil.id_tienda}`)
    }
  }, [loading, isTienda, perfil, router])

  // If Tienda role, show loading while redirecting
  if (isTienda) {
    return (
      <>
        <PageHeader title="Directorio" subtitle="Redirigiendo a tu sucursal..." />
        <Card className="animate-pulse"><div className="h-64 bg-gray-100 rounded-lg" /></Card>
      </>
    )
  }

  // Unique regions from data (only for Admin)
  const regionOptions = [
    { value: '', label: 'Todas las regiones' },
    ...Array.from(new Set(tiendas.map(t => t.region?.nombre_region).filter(Boolean)))
      .map(r => ({ value: r!, label: r! })),
  ]

  const filtered = tiendas.filter((t) => {
    const matchRegion = isRegional || !filterRegion || t.region?.nombre_region === filterRegion
    const matchSearch = !searchText || t.sucursal.toLowerCase().includes(searchText.toLowerCase())
    return matchRegion && matchSearch
  })

  if (loading) {
    return (
      <>
        <PageHeader title="Directorio" subtitle="Cargando sucursales..." />
        <Card className="animate-pulse"><div className="h-64 bg-gray-100 rounded-lg" /></Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Directorio" subtitle="Error al cargar datos" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Directorio"
        subtitle="Consulta de sucursales — haz clic para ver detalle"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Region filter: only visible for Admin */}
        {!isRegional && (
          <div className="w-full sm:w-52">
            <select
              value={filterRegion}
              onChange={handleRegionChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700
                focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] appearance-none cursor-pointer"
            >
              {regionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar sucursal..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
              transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-[13px]">No se encontraron sucursales con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cumplimiento</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Región</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gte. Tienda</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/directorio/${t.id}`)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-center">
                      {loadingCompliance ? (
                        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse mx-auto" />
                      ) : (
                        <div className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-[9px] font-bold border-2 mx-auto ${
                          (storeComplianceMap[t.id] ?? 0) < 50 ? 'border-red-100 text-red-600 bg-red-50' : 
                          (storeComplianceMap[t.id] ?? 0) < 85 ? 'border-orange-100 text-orange-600 bg-orange-50' : 
                          'border-green-100 text-green-600 bg-green-50'
                        }`}>
                          {storeComplianceMap[t.id] !== undefined ? `${storeComplianceMap[t.id].toFixed(0)}%` : '0%'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{t.sucursal}</td>
                    <td className="py-3 px-4 text-gray-500">{t.region?.nombre_region ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{t.gerente_tienda ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">{t.direccion_sucursal ?? '—'}</td>
                    <td className="py-3 px-4">
                      <p className="text-gray-500">{t.celular ?? '—'}</p>
                      <p className="text-gray-400 text-[10px]">{t.correo ?? ''}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-300 group-hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
