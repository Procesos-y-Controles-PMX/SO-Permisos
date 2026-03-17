'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { EstatusPermiso } from '@/types'

// ── Mock data ──────────────────────────────────────────────

interface PermisoRow {
  id: number
  sucursal: string
  tipo_permiso: string
  fecha_vencimiento: string
  estatus: EstatusPermiso
  puntaje: number
}

const mockPermisos: PermisoRow[] = [
  { id: 1, sucursal: 'CEMEX Puebla Centro', tipo_permiso: 'Licencia Municipal', fecha_vencimiento: '2026-01-15', estatus: 'Vencido', puntaje: 0 },
  { id: 2, sucursal: 'CEMEX Puebla Centro', tipo_permiso: 'Uso de Suelo', fecha_vencimiento: '2026-06-30', estatus: 'Vigente', puntaje: 1 },
  { id: 3, sucursal: 'CEMEX Monterrey Norte', tipo_permiso: 'Protección Civil', fecha_vencimiento: '2026-04-10', estatus: 'Por Vencer', puntaje: 0.5 },
  { id: 4, sucursal: 'CEMEX CDMX Sur', tipo_permiso: 'Licencia Estatal', fecha_vencimiento: '2025-12-01', estatus: 'Vencido', puntaje: 0 },
  { id: 5, sucursal: 'CEMEX Guadalajara', tipo_permiso: 'Pago de Tenencia', fecha_vencimiento: '2026-09-15', estatus: 'Vigente', puntaje: 1 },
  { id: 6, sucursal: 'CEMEX Mérida', tipo_permiso: 'Aviso de Funcionamiento', fecha_vencimiento: '2026-02-28', estatus: 'Vencido', puntaje: 0 },
  { id: 7, sucursal: 'CEMEX Tuxtla', tipo_permiso: 'Licencia Municipal', fecha_vencimiento: '2026-05-20', estatus: 'Por Vencer', puntaje: 0.5 },
]

// ── Component ──────────────────────────────────────────────

export default function PermisosPage() {
  const [activeTab, setActiveTab] = useState('listado')
  const [showModal, setShowModal] = useState(false)
  const [selectedPermiso, setSelectedPermiso] = useState<PermisoRow | null>(null)

  const handleSolicitud = (permiso: PermisoRow) => {
    setSelectedPermiso(permiso)
    setShowModal(true)
  }

  return (
    <>
      <PageHeader
        title="Permisos"
        subtitle="Gestión de permisos y licencias vigentes por sucursal"
      />

      <div className="mb-5">
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
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ]}
          defaultTab="listado"
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'listado' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Permiso</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estatus</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockPermisos.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.sucursal}</td>
                    <td className="py-3 px-4 text-gray-500">{p.tipo_permiso}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(p.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusToBadgeVariant(p.estatus)}>{p.estatus}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.estatus === 'Vencido' && (
                        <Button size="sm" variant="primary" onClick={() => handleSolicitud(p)}>
                          Crear Solicitud
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="py-16 text-center">
          <p className="text-gray-300 text-lg mb-1">📊 Estadísticas de Permisos</p>
          <p className="text-gray-400 text-[13px]">Gráficos de cumplimiento por tipo de permiso y sucursal.</p>
        </Card>
      )}

      {/* Modal — Crear Solicitud */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Crear Solicitud de Renovación"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>Enviar Solicitud</Button>
          </>
        }
      >
        {selectedPermiso && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-[13px] font-medium text-slate-700">
                {selectedPermiso.tipo_permiso} — <span className="text-red-600">{selectedPermiso.sucursal}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Venció el {new Date(selectedPermiso.fecha_vencimiento).toLocaleDateString('es-MX')}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Nueva Vigencia Propuesta
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Archivo PDF
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-red-300 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-[11px] text-gray-400">Arrastra tu archivo o haz clic para seleccionar</p>
                <p className="text-[10px] text-gray-300 mt-1">Solo archivos PDF, máx. 10MB</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
