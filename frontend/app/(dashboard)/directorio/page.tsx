'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import { useTiendas } from '@/hooks/useTiendas'

// ── Component ──────────────────────────────────────────────

export default function DirectorioPage() {
  const { data: tiendas, loading, error } = useTiendas()
  const [filterRegion, setFilterRegion] = useState('')
  const [searchText, setSearchText] = useState('')

  // Unique regions from data
  const regionOptions = [
    { value: '', label: 'Todas las regiones' },
    ...Array.from(new Set(tiendas.map(t => t.regiones?.nombre_region).filter(Boolean)))
      .map(r => ({ value: r!, label: r! })),
  ]

  const filtered = tiendas.filter((t) => {
    const matchRegion = !filterRegion || t.regiones?.nombre_region === filterRegion
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
        subtitle="Consulta de sucursales, regiones y gerentes"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="w-full sm:w-52">
          <Select
            options={regionOptions}
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            placeholder="Filtrar por región"
          />
        </div>
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
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Región</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gte. Regional</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gte. Tienda</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">{t.sucursal}</td>
                    <td className="py-3 px-4 text-gray-500">{t.regiones?.nombre_region ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{t.regiones?.gerente_regional ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{t.gerente_tienda ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">{t.direccion_sucursal ?? '—'}</td>
                    <td className="py-3 px-4">
                      <p className="text-gray-500">{t.celular ?? '—'}</p>
                      <p className="text-gray-400 text-[10px]">{t.correo ?? ''}</p>
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
