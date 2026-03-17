'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import type { Tienda } from '@/types'

// ── Mock data ──────────────────────────────────────────────

const mockTiendas: (Tienda & { nombre_region: string; gerente_regional: string })[] = [
  { id: 1, sucursal: 'CEMEX Puebla Centro', centro: '1001', cc: 'CC-01', id_region: 1, gerente_tienda: 'Ana Martínez', celular: '222-111-0001', correo: 'ana.martinez@cemex.com', direccion_sucursal: 'Av. Reforma #123, Puebla', nombre_region: 'Centro', gerente_regional: 'Carlos López' },
  { id: 2, sucursal: 'CEMEX Monterrey Norte', centro: '2001', cc: 'CC-02', id_region: 2, gerente_tienda: 'Roberto García', celular: '818-222-0002', correo: 'roberto.garcia@cemex.com', direccion_sucursal: 'Blvd. Rogelio Cantú #456, Monterrey', nombre_region: 'Noreste', gerente_regional: 'Laura Sánchez' },
  { id: 3, sucursal: 'CEMEX CDMX Sur', centro: '3001', cc: 'CC-03', id_region: 3, gerente_tienda: 'María Hernández', celular: '555-333-0003', correo: 'maria.hernandez@cemex.com', direccion_sucursal: 'Calz. de Tlalpan #789, CDMX', nombre_region: 'Metro', gerente_regional: 'Fernando Díaz' },
  { id: 4, sucursal: 'CEMEX Guadalajara', centro: '4001', cc: 'CC-04', id_region: 4, gerente_tienda: 'José Ramírez', celular: '333-444-0004', correo: 'jose.ramirez@cemex.com', direccion_sucursal: 'Av. Vallarta #012, Guadalajara', nombre_region: 'Pacífico', gerente_regional: 'Patricia Morales' },
  { id: 5, sucursal: 'CEMEX Mérida', centro: '5001', cc: 'CC-05', id_region: 5, gerente_tienda: 'Claudia Torres', celular: '999-555-0005', correo: 'claudia.torres@cemex.com', direccion_sucursal: 'Calle 60 #345, Mérida', nombre_region: 'Península', gerente_regional: 'Alejandro Ruiz' },
  { id: 6, sucursal: 'CEMEX Tuxtla', centro: '6001', cc: 'CC-06', id_region: 6, gerente_tienda: 'Ricardo Flores', celular: '961-666-0006', correo: 'ricardo.flores@cemex.com', direccion_sucursal: 'Blvd. Belisario Domínguez #678, Tuxtla', nombre_region: 'Chiapas', gerente_regional: 'Sofía Vega' },
]

const regionOptions = [
  { value: '', label: 'Todas las regiones' },
  { value: 'Centro', label: 'Centro' },
  { value: 'Noreste', label: 'Noreste' },
  { value: 'Metro', label: 'Metro' },
  { value: 'Pacífico', label: 'Pacífico' },
  { value: 'Península', label: 'Península' },
  { value: 'Chiapas', label: 'Chiapas' },
]

// ── Component ──────────────────────────────────────────────

export default function DirectorioPage() {
  const [filterRegion, setFilterRegion] = useState('')
  const [searchText, setSearchText] = useState('')

  const filtered = mockTiendas.filter((t) => {
    const matchRegion = !filterRegion || t.nombre_region === filterRegion
    const matchSearch = !searchText || t.sucursal.toLowerCase().includes(searchText.toLowerCase())
    return matchRegion && matchSearch
  })

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
                    <td className="py-3 px-4 text-gray-500">{t.nombre_region}</td>
                    <td className="py-3 px-4 text-gray-500">{t.gerente_regional}</td>
                    <td className="py-3 px-4 text-gray-500">{t.gerente_tienda}</td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">{t.direccion_sucursal}</td>
                    <td className="py-3 px-4">
                      <p className="text-gray-500">{t.celular}</p>
                      <p className="text-gray-400 text-[10px]">{t.correo}</p>
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
