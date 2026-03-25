'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { useSolicitudes } from '@/hooks/useSolicitudes'
import { useAuth } from '@/contexts/AuthContext'
import { getFileUrl } from '@/lib/storage'

// ── Component ──────────────────────────────────────────────

export default function SolicitudesPage() {
  const { data: solicitudes, loading, error, aprobar, rechazar } = useSolicitudes()
  const { isAdmin } = useAuth()
  const [filterEstatus, setFilterEstatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null)
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar')
  const [comentarios, setComentarios] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filtered = solicitudes.filter((s) => {
    return !filterEstatus || s.estatus_solicitud === filterEstatus
  })

  const handleAction = (solicitud: any, action: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud)
    setAccion(action)
    setComentarios('')
    setSubmitError(null)
    setShowModal(true)
  }

  const handleConfirm = async () => {
    if (!selectedSolicitud) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = accion === 'aprobar'
        ? await aprobar(selectedSolicitud.id, comentarios || undefined)
        : await rechazar(selectedSolicitud.id, comentarios)

      if (result.error) throw new Error(result.error)
      setShowModal(false)
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async (path: string) => {
    const { url, error } = await getFileUrl(path)
    if (url) window.open(url, '_blank')
    if (error) alert('Error al descargar: ' + error)
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Solicitudes" subtitle="Cargando solicitudes..." />
        <Card className="animate-pulse"><div className="h-64 bg-gray-100 rounded-lg" /></Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Solicitudes" subtitle="Error al cargar datos" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Solicitudes"
        subtitle="Revisión y aprobación de solicitudes de permisos"
      />

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="w-full sm:w-52">
          <Select
            options={[
              { value: '', label: 'Todos los estatus' },
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Aprobado', label: 'Aprobado' },
              { value: 'Rechazado', label: 'Rechazado' },
            ]}
            value={filterEstatus}
            onChange={(e) => setFilterEstatus(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-[13px]">No hay solicitudes con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vigencia</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Archivo</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estatus</th>
                  {isAdmin && (
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">#{s.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{s.tienda?.sucursal ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{s.tipo_permiso?.nombre_permiso ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(s.fecha_solicitud).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {s.vigencia_propuesta
                        ? new Date(s.vigencia_propuesta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {s.archivo_adjunto_path ? (
                        <button
                          onClick={() => handleDownload(s.archivo_adjunto_path)}
                          className="text-red-500 hover:text-red-600 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar
                        </button>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusToBadgeVariant(s.estatus_solicitud)}>{s.estatus_solicitud}</Badge>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {s.estatus_solicitud === 'Pendiente' && (
                          <div className="flex gap-1.5 justify-end">
                            <Button size="sm" variant="primary" onClick={() => handleAction(s, 'aprobar')}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleAction(s, 'rechazar')}>
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={accion === 'aprobar' ? '✅ Aprobar Solicitud' : '❌ Rechazar Solicitud'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</Button>
            <Button
              variant={accion === 'aprobar' ? 'primary' : 'danger'}
              onClick={handleConfirm}
              disabled={submitting || (accion === 'rechazar' && !comentarios.trim())}
            >
              {submitting ? 'Procesando...' : accion === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
            </Button>
          </>
        }
      >
        {selectedSolicitud && (
          <div className="space-y-4">
            {submitError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-[12px]">
                ❌ {submitError}
              </div>
            )}

            <div className={`${accion === 'aprobar' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} border rounded-xl p-4`}>
              <p className="text-[13px] font-medium text-slate-700">
                {selectedSolicitud.tipo_permiso?.nombre_permiso} — <span className="font-semibold">{selectedSolicitud.tienda?.sucursal}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Solicitud #{selectedSolicitud.id} • Vigencia propuesta: {selectedSolicitud.vigencia_propuesta
                  ? new Date(selectedSolicitud.vigencia_propuesta).toLocaleDateString('es-MX')
                  : '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Comentarios {accion === 'rechazar' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder={accion === 'rechazar' ? 'Motivo del rechazo (requerido)...' : 'Comentarios opcionales...'}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]
                  focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
                  transition-all duration-200 resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
