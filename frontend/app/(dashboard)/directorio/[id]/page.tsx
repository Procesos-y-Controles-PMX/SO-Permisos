'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useTiendaDetalle } from '@/hooks/useTiendaDetalle'
import { useSolicitudes } from '@/hooks/useSolicitudes'
import { useAuth } from '@/contexts/AuthContext'
import { uploadFile, getFileUrl } from '@/lib/storage'
import type { ConfiguracionTiendaPermiso } from '@/types'

// ── Icons ──────────────────────────────────────────────────

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

// ── Section Header ──────────────────────────────────────────

function SectionHeader({ icon, title, count, color }: { icon: React.ReactNode; title: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
        <p className="text-[11px] text-gray-400">{count} registro{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────

export default function TiendaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const idTienda = Number(params.id)
  const { perfil, isAdmin, isTienda, isRegional } = useAuth()

  const { tienda, permisos, solicitudes, loading, error, refetch } = useTiendaDetalle(idTienda)
  const { aprobar, rechazar, crearSolicitud } = useSolicitudes(idTienda)

  // ── Upload Modal state ──
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ConfiguracionTiendaPermiso | null>(null)
  const [vigencia, setVigencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Review Modal state ──
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null)
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar')
  const [comentarios, setComentarios] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // ── Derived data ──
  const permisosVigentes = useMemo(() =>
    permisos.filter(p => p.permiso_vigente?.estatus === 'Aprobado'),
    [permisos]
  )

  const permisosVencidos = useMemo(() =>
    permisos.filter(p => p.permiso_vigente?.estatus !== 'Aprobado'),
    [permisos]
  )

  const solicitudesPendientes = useMemo(() =>
    solicitudes.filter(s => s.estatus_solicitud === 'Pendiente'),
    [solicitudes]
  )

  // ── Check if upload is blocked for a given config ──
  const isUploadBlocked = (config: ConfiguracionTiendaPermiso): { blocked: boolean; reason: string } => {
    // Find solicitudes for this specific permiso type
    const relatedSolicitudes = solicitudes.filter(s => s.id_tipo_permiso === config.id_tipo_permiso)
    const hasPendiente = relatedSolicitudes.some(s => s.estatus_solicitud === 'Pendiente')
    const hasAprobada = relatedSolicitudes.some(s => s.estatus_solicitud === 'Aprobado')
    const vigente = config.permiso_vigente

    if (hasPendiente) {
      return { blocked: true, reason: 'Ya tienes una solicitud pendiente de revisión' }
    }
    if (vigente?.estatus === 'Aprobado' || vigente?.estatus === 'Vigente') {
      return { blocked: true, reason: 'Este permiso ya está vigente' }
    }
    if (hasAprobada && vigente?.estatus !== 'Vencido') {
      return { blocked: true, reason: 'Solicitud ya aprobada' }
    }
    return { blocked: false, reason: '' }
  }

  // ── Handlers ──
  const handleOpenUpload = (config: ConfiguracionTiendaPermiso) => {
    setSelectedConfig(config)
    setVigencia('')
    setArchivo(null)
    setSubmitError(null)
    setShowUploadModal(true)
  }

  const handleSubmitUpload = async () => {
    if (!selectedConfig || !vigencia) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let archivoPath: string | null = null
      if (archivo && perfil) {
        const { path, error: uploadErr } = await uploadFile(
          archivo,
          selectedConfig.id_tienda,
          selectedConfig.tipo_permiso?.nombre_permiso || 'Permiso'
        )
        if (uploadErr) throw new Error(uploadErr)
        archivoPath = path
      }

      const { error: createErr } = await crearSolicitud({
        id_tienda: selectedConfig.id_tienda,
        id_tipo_permiso: selectedConfig.id_tipo_permiso,
        vigencia_propuesta: vigencia,
        archivo_adjunto_path: archivoPath,
      })

      if (createErr) throw new Error(createErr)
      setShowUploadModal(false)
      await refetch()
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenReview = (solicitud: any, action: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud)
    setAccion(action)
    setComentarios('')
    setReviewError(null)
    setShowReviewModal(true)
  }

  const handleConfirmReview = async () => {
    if (!selectedSolicitud) return
    setReviewing(true)
    setReviewError(null)

    try {
      const result = accion === 'aprobar'
        ? await aprobar(selectedSolicitud.id, comentarios || undefined)
        : await rechazar(selectedSolicitud.id, comentarios)

      if (result.error) throw new Error(result.error)
      setShowReviewModal(false)
      await refetch()
    } catch (e: any) {
      setReviewError(e.message)
    } finally {
      setReviewing(false)
    }
  }

  const handleViewFile = async (path: string) => {
    const { url, error } = await getFileUrl(path)
    if (url) window.open(url, '_blank')
    if (error) alert('Error al abrir archivo: ' + error)
  }

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detalle de Sucursal" subtitle="Cargando..." />
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse"><div className="h-32 bg-gray-100 rounded-lg" /></Card>
        ))}
      </div>
    )
  }

  if (error || !tienda) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detalle de Sucursal" subtitle="Error" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm mb-4">❌ {error || 'Tienda no encontrada'}</p>
          <Button variant="secondary" onClick={() => router.push('/directorio')}>Volver al Directorio</Button>
        </Card>
      </div>
    )
  }

  // ── Main Render ──
  return (
    <>
      {/* Back button + Header */}
      <div className="flex items-center gap-3 mb-6">
        {(!isTienda) && (
          <button
            onClick={() => router.push('/directorio')}
            className="p-2 rounded-xl text-gray-400 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
            title="Volver al Directorio"
          >
            <BackIcon />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{tienda.sucursal}</h1>
          <p className="text-[12px] text-gray-400">{tienda.region?.nombre_region ?? 'Sin región asignada'}</p>
        </div>
      </div>

      {/* ── Store Info Card ── */}
      <Card className="mb-6 !p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <h2 className="text-white font-semibold text-[14px]">Información de la Sucursal</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 px-6 py-5">
          <InfoItem label="Sucursal" value={tienda.sucursal} />
          <InfoItem label="Región" value={tienda.region?.nombre_region} />
          <InfoItem label="Gerente Regional" value={tienda.region?.gerente_regional} />
          <InfoItem label="Gerente de Tienda" value={tienda.gerente_tienda} />
          <InfoItem label="Dirección" value={tienda.direccion_sucursal} />
          <InfoItem label="Teléfono" value={tienda.celular} />
          <InfoItem label="Correo" value={tienda.correo} />
          <InfoItem label="Centro" value={tienda.centro} />
          <InfoItem label="CC" value={tienda.cc} />
        </div>
      </Card>

      {/* ── Section 1: Permisos Vigentes ── */}
      <Card className="mb-6">
        <SectionHeader
          icon={<CheckCircleIcon />}
          title="Permisos Vigentes"
          count={permisosVigentes.length}
          color="green"
        />
        {permisosVigentes.length === 0 ? (
          <EmptyState message="No hay permisos vigentes registrados." />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Permiso</Th>
                  <Th>Vencimiento</Th>
                  <Th>Estatus</Th>
                  <Th align="right">Archivo</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permisosVigentes.map((p) => (
                  <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                    <Td>
                      <span className="font-medium text-slate-700">{p.tipo_permiso?.nombre_permiso ?? '—'}</span>
                      {p.obligatorio && <span className="ml-2 text-[9px] font-bold text-red-500 uppercase">Obligatorio</span>}
                    </Td>
                    <Td>
                      <span className="font-mono text-[12px] text-slate-600">
                        {p.permiso_vigente?.fecha_vencimiento
                          ? new Date(p.permiso_vigente.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={statusToBadgeVariant(p.permiso_vigente?.estatus || '')}>{p.permiso_vigente?.estatus}</Badge>
                    </Td>
                    <Td align="right">
                      {p.permiso_vigente?.archivo_path && (
                        <button
                          onClick={() => handleViewFile(p.permiso_vigente!.archivo_path!)}
                          className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium transition-colors"
                        >
                          <EyeIcon /> Ver
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Section 2: Permisos Vencidos / No Subidos ── */}
      <Card className="mb-6">
        <SectionHeader
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Permisos Vencidos / Pendientes de Carga"
          count={permisosVencidos.length}
          color="red"
        />
        {permisosVencidos.length === 0 ? (
          <EmptyState message="¡Todo en orden! No hay permisos pendientes." />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Permiso Requerido</Th>
                  <Th>Estatus</Th>
                  <Th align="right">Acción</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permisosVencidos.map((p) => {
                  const upload = isUploadBlocked(p)
                  return (
                    <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                      <Td>
                        <span className="font-medium text-slate-700">{p.tipo_permiso?.nombre_permiso ?? '—'}</span>
                        {p.obligatorio && <span className="ml-2 text-[9px] font-bold text-red-500 uppercase">Obligatorio</span>}
                      </Td>
                      <Td>
                        {p.permiso_vigente ? (
                          <Badge variant="danger">{p.permiso_vigente.estatus}</Badge>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            No Subido
                          </span>
                        )}
                      </Td>
                      <Td align="right">
                        {isTienda && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenUpload(p)}
                            disabled={upload.blocked}
                          >
                            {upload.blocked ? upload.reason : (p.permiso_vigente ? 'Renovar' : 'Subir Documento')}
                          </Button>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Section 3: Solicitudes ── */}
      {(() => {
        // Tienda sees only "Pendiente" (active outbox); Admin/Regional see all
        const solicitudesVisibles = isTienda
          ? solicitudes.filter(s => s.estatus_solicitud === 'Pendiente')
          : solicitudes
        const seccionTitulo = isTienda ? 'Solicitudes En Revisión' : 'Solicitudes'
        const emptyMsg = isTienda
          ? 'No tienes solicitudes pendientes de revisión.'
          : 'No hay solicitudes registradas para esta sucursal.'

        return (
      <Card>
        <SectionHeader
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title={seccionTitulo}
          count={solicitudesVisibles.length}
          color="amber"
        />
        {solicitudesVisibles.length === 0 ? (
          <EmptyState message={emptyMsg} />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Permiso</Th>
                  <Th>Fecha</Th>
                  <Th>Vigencia Propuesta</Th>
                  <Th>Estatus</Th>
                  <Th>Comentarios Admin</Th>
                  <Th>Archivo</Th>
                  {isAdmin && <Th align="right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {solicitudesVisibles.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/20 transition-colors">
                    <Td>
                      <span className="font-medium text-slate-700">{s.tipo_permiso?.nombre_permiso ?? '—'}</span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] text-gray-500">
                        {new Date(s.fecha_solicitud).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] text-gray-500">
                        {s.vigencia_propuesta
                          ? new Date(s.vigencia_propuesta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={statusToBadgeVariant(s.estatus_solicitud)}>{s.estatus_solicitud}</Badge>
                    </Td>
                    <Td>
                      {s.comentarios_admin ? (
                        <div className="max-w-[220px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            {s.estatus_solicitud === 'Rechazado' ? '⚠️ Motivo' : '💬 Nota'}
                          </p>
                          <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                            {s.comentarios_admin}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </Td>
                    <Td>
                      {s.archivo_adjunto_path ? (
                        <button
                          onClick={() => handleViewFile(s.archivo_adjunto_path)}
                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-[11px] font-medium transition-colors"
                        >
                          <DownloadIcon /> Ver
                        </button>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </Td>
                    {isAdmin && (
                      <Td align="right">
                        {s.estatus_solicitud === 'Pendiente' && (
                          <div className="flex gap-1.5 justify-end">
                            <Button size="sm" variant="primary" onClick={() => handleOpenReview(s, 'aprobar')}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleOpenReview(s, 'rechazar')}>
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
        )
      })()}

      {/* ══════════════════════════════════════════════════════
           Modal: Upload Document
         ══════════════════════════════════════════════════════ */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={selectedConfig?.permiso_vigente ? 'Renovación de Permiso' : 'Nueva Carga de Documento'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={submitting}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmitUpload} disabled={submitting || !vigencia}>
              {submitting ? 'Enviando...' : 'Enviar a Revisión'}
            </Button>
          </>
        }
      >
        {selectedConfig && (
          <div className="space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-[13px] flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {submitError}
              </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[15px] font-bold text-slate-800">{selectedConfig.tipo_permiso?.nombre_permiso}</h4>
                <Badge variant={selectedConfig.obligatorio ? 'danger' : 'neutral'}>
                  {selectedConfig.obligatorio ? 'Crítico' : 'Opcional'}
                </Badge>
              </div>
              <p className="text-[12px] text-slate-500">Tienda: <span className="font-semibold text-slate-700">{tienda?.sucursal}</span></p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Fecha de Vigencia Propuesta
              </label>
              <input
                type="date"
                value={vigencia}
                onChange={(e) => setVigencia(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-slate-700
                  focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Documento Probatorio (PDF)
              </label>
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center
                  ${archivo ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200'}
                `}
              >
                <input
                  id="file-upload-detail"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <label htmlFor="file-upload-detail" className="cursor-pointer">
                  {!archivo ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 mb-3">
                        <UploadIcon />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-700">Click para seleccionar</p>
                      <p className="text-[11px] text-gray-400 mt-1">Máximo 10MB • Solo archivos PDF</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-green-500 mb-3">
                        <CheckCircleIcon />
                      </div>
                      <p className="text-[13px] font-semibold text-green-700 truncate w-64 px-4">{archivo.name}</p>
                      <p className="text-[11px] text-green-600/70 mt-1">{(archivo.size / 1024 / 1024).toFixed(2)} MB • Listo para subir</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] text-orange-800/80 leading-relaxed">
                Al enviar este documento, entrará en proceso de validación por Mesa de Control. Serás notificado una vez que el estatus cambie.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
           Modal: Review (Aprobar / Rechazar) — Admin only
         ══════════════════════════════════════════════════════ */}
      <Modal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={accion === 'aprobar' ? '✅ Aprobar Solicitud' : '❌ Rechazar Solicitud'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)} disabled={reviewing}>Cancelar</Button>
            <Button
              variant={accion === 'aprobar' ? 'primary' : 'danger'}
              onClick={handleConfirmReview}
              disabled={reviewing || (accion === 'rechazar' && !comentarios.trim())}
            >
              {reviewing ? 'Procesando...' : accion === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
            </Button>
          </>
        }
      >
        {selectedSolicitud && (
          <div className="space-y-4">
            {reviewError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-[12px]">
                ❌ {reviewError}
              </div>
            )}

            <div className={`${accion === 'aprobar' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} border rounded-xl p-4`}>
              <p className="text-[13px] font-medium text-slate-700">
                {selectedSolicitud.tipo_permiso?.nombre_permiso} — <span className="font-semibold">{tienda?.sucursal}</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Solicitud #{selectedSolicitud.id} • Vigencia propuesta: {selectedSolicitud.vigencia_propuesta
                  ? new Date(selectedSolicitud.vigencia_propuesta).toLocaleDateString('es-MX')
                  : '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Comentarios {accion === 'rechazar' && <span className="text-red-500">* (obligatorio)</span>}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder={accion === 'rechazar' ? 'Motivo del rechazo (requerido)...' : 'Comentarios opcionales...'}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-slate-800
                  placeholder-gray-400
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

// ── Reusable table primitives ──

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-${align}`}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td className={`py-3.5 px-6 text-[13px] text-${align}`}>
      {children}
    </td>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[13px] text-slate-700 font-medium">{value || '—'}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <p className="text-[13px]">{message}</p>
    </div>
  )
}
