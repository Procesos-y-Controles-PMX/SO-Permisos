'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { usePermisos } from '@/hooks/usePermisos'
import { useSolicitudes } from '@/hooks/useSolicitudes'
import { useAuth } from '@/contexts/AuthContext'
import { uploadFile } from '@/lib/storage'

// ── Component ──────────────────────────────────────────────

export default function PermisosPage() {
  const [activeTab, setActiveTab] = useState('listado')
  const { data: permisos, loading, error } = usePermisos()
  const { crearSolicitud } = useSolicitudes()
  const { perfil, isTienda } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [selectedPermiso, setSelectedPermiso] = useState<any | null>(null)
  const [vigencia, setVigencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSolicitud = (permiso: any) => {
    setSelectedPermiso(permiso)
    setVigencia('')
    setArchivo(null)
    setSubmitError(null)
    setShowModal(true)
  }

  const handleSubmitSolicitud = async () => {
    if (!selectedPermiso || !vigencia) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let archivoPath: string | null = null

      // Upload file if provided
      if (archivo && perfil) {
        const { path, error: uploadErr } = await uploadFile(archivo, selectedPermiso.id_tienda)
        if (uploadErr) throw new Error(uploadErr)
        archivoPath = path
      }

      const { error: createErr } = await crearSolicitud({
        id_tienda: selectedPermiso.id_tienda,
        id_tipo_permiso: selectedPermiso.id_tipo_permiso,
        vigencia_propuesta: vigencia,
        archivo_adjunto_path: archivoPath,
      })

      if (createErr) throw new Error(createErr)
      setShowModal(false)
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Permisos" subtitle="Cargando permisos..." />
        <Card className="animate-pulse"><div className="h-64 bg-gray-100 rounded-lg" /></Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Permisos" subtitle="Error al cargar datos" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
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
          {permisos.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-[13px]">No hay permisos registrados.</p>
            </div>
          ) : (
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
                  {permisos.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700">{p.tiendas?.sucursal ?? '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{p.catalogo_permisos?.nombre_permiso ?? '—'}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {p.fecha_vencimiento
                          ? new Date(p.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusToBadgeVariant(p.estatus)}>{p.estatus}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.estatus === 'Vencido' && (isTienda || true) && (
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
          )}
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
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmitSolicitud} disabled={submitting || !vigencia}>
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </>
        }
      >
        {selectedPermiso && (
          <div className="space-y-4">
            {submitError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-[12px]">
                ❌ {submitError}
              </div>
            )}

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-[13px] font-medium text-slate-700">
                {selectedPermiso.catalogo_permisos?.nombre_permiso} — <span className="text-red-600">{selectedPermiso.tiendas?.sucursal}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Venció el {selectedPermiso.fecha_vencimiento
                  ? new Date(selectedPermiso.fecha_vencimiento).toLocaleDateString('es-MX')
                  : '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Nueva Vigencia Propuesta
              </label>
              <input
                type="date"
                value={vigencia}
                onChange={(e) => setVigencia(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="w-full text-[12px] text-gray-500 file:mr-3 file:py-2 file:px-4
                  file:rounded-lg file:border-0 file:text-[12px] file:font-medium
                  file:bg-red-50 file:text-red-600 hover:file:bg-red-100 file:cursor-pointer file:transition-colors"
              />
              {archivo && (
                <p className="text-[11px] text-green-600">✓ {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
