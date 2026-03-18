'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/Card'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import { usePermisos } from '@/hooks/usePermisos'
import { useAuth } from '@/contexts/AuthContext'

// ── Icons ──────────────────────────────────────────────────

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

// ── Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('estadisticas')
  const { data: permisos, loading, error, stats } = usePermisos()
  const { perfil } = useAuth()

  // Group by region for bar chart
  const regionStats = permisos.reduce<Record<string, { total: number; vigentes: number }>>((acc, p) => {
    const regionName = p.tiendas?.sucursal || 'Sin Región'
    if (!acc[regionName]) acc[regionName] = { total: 0, vigentes: 0 }
    acc[regionName].total++
    if (p.estatus === 'Vigente') acc[regionName].vigentes++
    return acc
  }, {})

  const regionChartData = Object.entries(regionStats).map(([name, s]) => ({
    region: name.replace('CEMEX ', ''),
    pct: s.total > 0 ? Math.round((s.vigentes / s.total) * 100) : 0,
  }))

  // Count distinct tiendas with all permits vigentes
  const tiendasCompletas = (() => {
    const tiendaMap = new Map<number, { total: number; vigentes: number }>()
    permisos.forEach((p) => {
      const tid = p.id_tienda
      if (!tiendaMap.has(tid)) tiendaMap.set(tid, { total: 0, vigentes: 0 })
      const entry = tiendaMap.get(tid)!
      entry.total++
      if (p.estatus === 'Vigente') entry.vigentes++
    })
    let count = 0
    tiendaMap.forEach((v) => { if (v.total > 0 && v.vigentes === v.total) count++ })
    return count
  })()

  if (loading) {
    return (
      <>
        <PageHeader title="Panel de Control" subtitle="Cargando datos..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg" />
            </Card>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Panel de Control" subtitle="Error al cargar datos" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm">❌ {error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Panel de Control"
        subtitle="Gestión integral de permisos y licencias por sucursal"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Tabs
          tabs={[
            {
              key: 'listado',
              label: 'Listado',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
            },
            {
              key: 'estadisticas',
              label: 'Estadísticas',
              icon: <ChartIcon />,
            },
          ]}
          defaultTab="estadisticas"
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'estadisticas' ? (
        <>
          {/* Stat Cards — real data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<CheckIcon />}
              value={`${stats.cumplimiento}%`}
              label="Cumplimiento Global"
              accentColor="blue"
            />
            <StatCard
              icon={<BuildingIcon />}
              value={tiendasCompletas}
              label="Tiendas Completas"
              sublabel={`de ${new Set(permisos.map(p => p.id_tienda)).size} tiendas`}
              accentColor="green"
            />
            <StatCard
              icon={<AlertIcon />}
              value={stats.vencidos + stats.porVencer}
              label="Con Pendientes"
              sublabel="Requieren atención"
              accentColor="red"
            />
            <StatCard
              icon={<DocIcon />}
              value={stats.vencidos}
              label="Permisos Vencidos"
              sublabel="Total global"
              accentColor="orange"
            />
          </div>

          {/* Bar Chart — real data */}
          {regionChartData.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-gray-400"><ChartIcon /></span>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-700">Cumplimiento por Sucursal</h3>
                  <p className="text-[11px] text-gray-400">Porcentaje de permisos vigentes por sucursal</p>
                </div>
              </div>

              <div className="flex items-end gap-3 justify-between h-52">
                {regionChartData.map((r) => (
                  <div key={r.region} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">{r.pct}%</span>
                    <div className="w-full bg-gray-50 rounded-t-md relative" style={{ height: '180px' }}>
                      <div
                        className={`absolute bottom-0 left-1 right-1 rounded-t-md transition-all duration-700 ${
                          r.pct >= 75 ? 'bg-green-500' : r.pct >= 50 ? 'bg-blue-500' : r.pct >= 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ height: `${(r.pct / 100) * 180}px` }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-400 font-medium text-center leading-tight mt-0.5 uppercase tracking-wider">
                      {r.region}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Permiso</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permisos.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.tiendas?.sucursal ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{p.catalogo_permisos?.nombre_permiso ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {p.fecha_vencimiento
                        ? new Date(p.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.estatus === 'Vigente' ? 'bg-green-50 text-green-600' :
                        p.estatus === 'Por Vencer' ? 'bg-orange-50 text-orange-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {p.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
