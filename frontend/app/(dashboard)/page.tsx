'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/Card'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Select from '@/components/ui/Select'

// ── Mock data ──────────────────────────────────────────────

const regionData = [
  { region: 'Metro', pct: 85 },
  { region: 'Centro', pct: 55 },
  { region: 'Oaxaca Norte', pct: 40 },
  { region: 'Noreste', pct: 31 },
  { region: 'Pacífico', pct: 52 },
  { region: 'Chiapas', pct: 33 },
  { region: 'Península', pct: 91 },
  { region: 'Veracruz', pct: 27 },
]

const matrixData = [
  { region: 'Centro',           col1: '55%', col2: '100%', col3: '7%',  col4: '0%',  col5: '0%', col6: '0%' },
  { region: 'Chiapas',          col1: '33%', col2: '100%', col3: '7%',  col4: '4%',  col5: '4%', col6: '0%' },
  { region: 'Metro',            col1: '63%', col2: '100%', col3: '0%',  col4: '13%', col5: '0%', col6: '0%' },
  { region: 'Noreste',          col1: '31%', col2: '100%', col3: '8%',  col4: '10%', col5: '8%', col6: '0%' },
  { region: 'Oaxaca Norte',     col1: '48%', col2: '100%', col3: '13%', col4: '0%',  col5: '0%', col6: '0%' },
  { region: 'Pacífico',         col1: '52%', col2: '100%', col3: '2%',  col4: '0%',  col5: '0%', col6: '0%' },
  { region: 'Península',        col1: '91%', col2: '100%', col3: '2%',  col4: '4%',  col5: '4%', col6: '0%' },
  { region: 'Veracruz-Tabasco', col1: '27%', col2: '100%', col3: '0%',  col4: '0%',  col5: '0%', col6: '0%' },
]

const regionOptions = [
  { value: '', label: 'Ver Región...' },
  ...regionData.map(r => ({ value: r.region, label: r.region })),
]

// ── Icons (SVG) ────────────────────────────────────────────

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

  return (
    <>
      <PageHeader
        title="Panel de Control"
        subtitle="Gestión integral de permisos y licencias por sucursal"
      />

      {/* Tabs + Filter pills */}
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
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-gray-400 bg-gray-100/80 rounded-full hover:bg-gray-200/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Todas las regiones
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-gray-400 bg-gray-100/80 rounded-full hover:bg-gray-200/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Todas las sucursales
          </button>
        </div>
      </div>

      {activeTab === 'estadisticas' ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<CheckIcon />}
              value="72.4%"
              label="Cumplimiento Global"
              accentColor="blue"
            />
            <StatCard
              icon={<BuildingIcon />}
              value="18"
              label="Tiendas Completas"
              sublabel="de 45 tiendas"
              accentColor="green"
            />
            <StatCard
              icon={<AlertIcon />}
              value="22"
              label="Con Pendientes"
              sublabel="Requieren atención"
              accentColor="red"
            />
            <StatCard
              icon={<DocIcon />}
              value="87"
              label="Permisos Faltantes"
              sublabel="Total global"
              accentColor="orange"
            />
          </div>

          {/* Bar Chart — Cumplimiento por Región */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-400"><ChartIcon /></span>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-700">Cumplimiento por Región</h3>
                  <p className="text-[11px] text-gray-400">Selecciona una región para ver detalle</p>
                </div>
              </div>
              <div className="w-36">
                <Select options={regionOptions} placeholder="Ver Región..." />
              </div>
            </div>

            {/* CSS bar chart */}
            <div className="relative">
              {/* Y-axis guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '28px' }}>
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-8 text-right">{val}%</span>
                    <div className="flex-1 border-t border-dashed border-gray-100" />
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div className="flex items-end gap-3 justify-between pl-10 h-52">
                {regionData.map((r) => (
                  <div key={r.region} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">{r.pct}%</span>
                    <div className="w-full bg-gray-50 rounded-t-md relative" style={{ height: '180px' }}>
                      <div
                        className="absolute bottom-0 left-1 right-1 bg-red-500 rounded-t-md transition-all duration-700"
                        style={{ height: `${(r.pct / 100) * 180}px` }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-400 font-medium text-center leading-tight mt-0.5 uppercase tracking-wider">
                      {r.region}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dashed line at ~25% */}
              <div className="absolute left-10 right-0 border-t border-dashed border-amber-400/60" style={{ bottom: `${(25 / 100) * 180 + 28}px` }} />
            </div>
          </Card>

          {/* Matrix Table — Región vs Tipo */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              <h3 className="text-[14px] font-semibold text-slate-700">Matriz Región vs Tipo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Región</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pago de Tenencia</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Licencia Municipal</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uso de Suelo</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Protección Civil</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Licencia Estatal</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aviso Func.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matrixData.map((row) => (
                    <tr key={row.region} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-600">{row.region}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-semibold ${parseInt(row.col1) >= 50 ? 'text-green-600' : 'text-red-500'}`}>{row.col1}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{row.col2}</td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{row.col3}</td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{row.col4}</td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{row.col5}</td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{row.col6}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card className="py-16 text-center">
          <p className="text-gray-300 text-lg mb-1">📋 Vista de Listado</p>
          <p className="text-gray-400 text-[13px]">Aquí se mostrará el listado completo de permisos por tienda.</p>
        </Card>
      )}
    </>
  )
}
