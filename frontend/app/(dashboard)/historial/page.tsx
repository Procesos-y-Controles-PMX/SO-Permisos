'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getFileUrl, uploadFile } from '@/lib/storage'
import { useSolicitudes } from '@/hooks/useSolicitudes'
import type { HistorialPermisoEstado } from '@/types'

interface HistorialPermisoItem {
  idTienda: number
  idTipoPermiso: number
  nombrePermiso: string
  obligatorio: boolean
  estado: HistorialPermisoEstado
  fechaActualizacion: string | null
  vigencia: string | null
  archivoPath: string | null
  comentariosAdmin: string | null
}

export default function HistorialPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isTienda, loading: authLoading } = useAuth()
  const { crearSolicitud } = useSolicitudes(perfil?.id_tienda ?? undefined)

  const [items, setItems] = useState<HistorialPermisoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEstatus, setFilterEstatus] = useState<HistorialPermisoEstado | ''>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistorialPermisoItem | null>(null)
  const [vigencia, setVigencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDraggingUpload, setIsDraggingUpload] = useState(false)
  const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/png,image/jpg,image/webp'
  const isImageFile = (file: File) => file.type.startsWith('image/')
  const todayStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])
  const isPastDate = useCallback((value: string) => value < todayStr, [todayStr])

  const fetchHistorial = useCallback(async () => {
    if (!perfil || !perfil.id_tienda) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const tiendaId = perfil.id_tienda as number

    try {
      const { data: configData, error: configErr } = await supabase
        .from('configuracion_tienda_permisos')
        .select(`
          id_tipo_permiso,
          obligatorio,
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .eq('id_tienda', perfil.id_tienda)
        .order('id_tipo_permiso', { ascending: true })

      if (configErr) throw configErr

      const { data: solicitudesData, error: solicitudesErr } = await supabase
        .from('solicitudes')
        .select(`
          *,
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .eq('id_tienda', perfil.id_tienda)
        .order('fecha_solicitud', { ascending: false })

      if (solicitudesErr) throw solicitudesErr

      const { data: vigentesData, error: vigentesErr } = await supabase
        .from('permisos_vigentes')
        .select('id_tipo_permiso, estatus, fecha_vencimiento, archivo_path, ultima_actualizacion')
        .eq('id_tienda', perfil.id_tienda)
        .order('ultima_actualizacion', { ascending: false })

      if (vigentesErr) throw vigentesErr

      const solicitudesPorPermiso = new Map<number, any[]>()
      ;(solicitudesData || []).forEach((s) => {
        const list = solicitudesPorPermiso.get(s.id_tipo_permiso) || []
        list.push(s)
        solicitudesPorPermiso.set(s.id_tipo_permiso, list)
      })

      const vigenteMasRecientePorPermiso = new Map<number, any>()
      ;(vigentesData || []).forEach((v) => {
        if (!vigenteMasRecientePorPermiso.has(v.id_tipo_permiso)) {
          vigenteMasRecientePorPermiso.set(v.id_tipo_permiso, v)
        }
      })

      const activeStatuses = new Set(['Activo', 'Aprobado'])
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const resolvedItems: HistorialPermisoItem[] = (configData || []).map((cfg: any) => {
        const idTipoPermiso = cfg.id_tipo_permiso
        const nombrePermiso = cfg.tipo_permiso?.nombre_permiso || 'Permiso desconocido'
        const solicitudes = solicitudesPorPermiso.get(idTipoPermiso) || []
        const pendiente = solicitudes.find((s) => s.estatus_solicitud === 'Pendiente')
        const ultimaSolicitud = solicitudes[0]
        const vigente = vigenteMasRecientePorPermiso.get(idTipoPermiso)
        const isExpired = Boolean(
          vigente?.fecha_vencimiento &&
          new Date(vigente.fecha_vencimiento).setHours(0, 0, 0, 0) < today.getTime()
        )

        if (pendiente) {
          return {
            idTienda: tiendaId,
            idTipoPermiso,
            nombrePermiso,
            obligatorio: cfg.obligatorio ?? true,
            estado: 'En Revisión',
            fechaActualizacion: pendiente.fecha_solicitud || null,
            vigencia: pendiente.vigencia_propuesta || null,
            archivoPath: pendiente.archivo_adjunto_path || null,
            comentariosAdmin: null,
          }
        }

        if (ultimaSolicitud?.estatus_solicitud === 'Rechazado') {
          return {
            idTienda: tiendaId,
            idTipoPermiso,
            nombrePermiso,
            obligatorio: cfg.obligatorio ?? true,
            estado: 'Rechazado',
            fechaActualizacion: ultimaSolicitud.fecha_solicitud || null,
            vigencia: ultimaSolicitud.vigencia_propuesta || null,
            archivoPath: ultimaSolicitud.archivo_adjunto_path || null,
            comentariosAdmin: ultimaSolicitud.comentarios_admin || null,
          }
        }

        if (vigente && activeStatuses.has(vigente.estatus) && !isExpired) {
          return {
            idTienda: tiendaId,
            idTipoPermiso,
            nombrePermiso,
            obligatorio: cfg.obligatorio ?? true,
            estado: 'Aceptado',
            fechaActualizacion: vigente.ultima_actualizacion || null,
            vigencia: vigente.fecha_vencimiento || null,
            archivoPath: vigente.archivo_path || null,
            comentariosAdmin: null,
          }
        }

        return {
          idTienda: tiendaId,
          idTipoPermiso,
          nombrePermiso,
          obligatorio: cfg.obligatorio ?? true,
          estado: 'No Subido',
          fechaActualizacion: null,
          vigencia: null,
          archivoPath: null,
          comentariosAdmin: null,
        }
      })

      setItems(resolvedItems)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil])

  useEffect(() => {
    if (!authLoading && perfil) fetchHistorial()
  }, [authLoading, perfil, fetchHistorial])

  // Non-tienda redirect
  useEffect(() => {
    if (!authLoading && !isTienda) {
      router.replace('/directorio')
    }
  }, [authLoading, isTienda, router])

  const handleViewFile = async (path: string) => {
    const { url, error } = await getFileUrl(path)
    if (url) window.open(url, '_blank')
    if (error) alert('Error al abrir archivo: ' + error)
  }

  const handleOpenUpload = (item: HistorialPermisoItem) => {
    setSelectedItem(item)
    setVigencia('')
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setArchivo(null)
    setSubmitError(null)
    setShowUploadModal(true)
  }

  const validateAndSelectFile = useCallback((file: File | null) => {
    if (!file) return
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setSubmitError('El archivo supera el límite de 10MB.')
      return
    }
    const isAccepted = ACCEPTED_TYPES.split(',').includes(file.type)
    if (!isAccepted) {
      setSubmitError('Formato no permitido. Usa PDF, JPG, PNG o WEBP.')
      return
    }
    setSubmitError(null)
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setArchivo(file)
    if (isImageFile(file)) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }, [ACCEPTED_TYPES])

  useEffect(() => {
    return () => {
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingUpload(false)
    validateAndSelectFile(e.dataTransfer.files?.[0] ?? null)
  }, [validateAndSelectFile])

  const handleSubmitUpload = async () => {
    if (!selectedItem || !vigencia || !archivo) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isPastDate(vigencia)) {
        throw new Error('La fecha de vigencia no puede ser anterior al día de hoy.')
      }
      const { path, error: uploadErr } = await uploadFile(
        archivo,
        selectedItem.idTienda,
        selectedItem.nombrePermiso || 'Permiso'
      )
      if (uploadErr) throw new Error(uploadErr)

      const { error: createErr } = await crearSolicitud({
        id_tienda: selectedItem.idTienda,
        id_tipo_permiso: selectedItem.idTipoPermiso,
        vigencia_propuesta: vigencia,
        archivo_adjunto_path: path,
      })
      if (createErr) throw new Error(createErr)

      setShowUploadModal(false)
      await fetchHistorial()
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const sortedItems = useMemo(() => {
    const statusPriority: Record<HistorialPermisoEstado, number> = {
      Rechazado: 0,
      'No Subido': 1,
      'En Revisión': 2,
      Aceptado: 3,
    }

    return [...items].sort((a, b) => {
      const byStatus = statusPriority[a.estado] - statusPriority[b.estado]
      if (byStatus !== 0) return byStatus

      const aDate = a.fechaActualizacion ? new Date(a.fechaActualizacion).getTime() : 0
      const bDate = b.fechaActualizacion ? new Date(b.fechaActualizacion).getTime() : 0
      if (bDate !== aDate) return bDate - aDate

      return a.nombrePermiso.localeCompare(b.nombrePermiso, 'es-MX')
    })
  }, [items])

  const filtered = sortedItems.filter((item) => {
    if (!filterEstatus) return true
    return item.estado === filterEstatus
  })

  if (authLoading || loading) {
    return (
      <>
        <PageHeader title="Historial de Solicitudes" subtitle="Cargando..." />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><div className="h-24 bg-gray-100 rounded-lg" /></Card>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Historial" subtitle="Error" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
  }

  // Counts
  const countNoSubido = items.filter((i) => i.estado === 'No Subido').length
  const countEnRevision = items.filter((i) => i.estado === 'En Revisión').length
  const countAceptado = items.filter((i) => i.estado === 'Aceptado').length
  const countRechazado = items.filter((i) => i.estado === 'Rechazado').length

  return (
    <>
      <PageHeader title="Historial de Permisos" subtitle="Estado actual por permiso configurado" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'No Subido' ? '' : 'No Subido')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'No Subido'
              ? 'bg-gray-50 border-gray-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <p className="text-2xl font-bold text-gray-600">{countNoSubido}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">No Subido</p>
        </button>
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'En Revisión' ? '' : 'En Revisión')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'En Revisión'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-amber-200'
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{countEnRevision}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">En Revisión</p>
        </button>
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'Aceptado' ? '' : 'Aceptado')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'Aceptado'
              ? 'bg-green-50 border-green-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-green-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{countAceptado}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Aprobados</p>
        </button>
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'Rechazado' ? '' : 'Rechazado')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'Rechazado'
              ? 'bg-red-50 border-red-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-red-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{countRechazado}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Rechazados</p>
        </button>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-[13px]">No hay registros con este filtro.</p>
          {filterEstatus && (
            <button onClick={() => setFilterEstatus('')} className="text-red-500 text-[12px] font-medium mt-2 hover:underline">
              Ver todos
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isRechazado = item.estado === 'Rechazado'
            const isEnRevision = item.estado === 'En Revisión'
            const isNoSubido = item.estado === 'No Subido'

            return (
              <Card
                key={item.idTipoPermiso}
                className={`transition-all duration-200 ${
                  isNoSubido ? 'border-gray-200 bg-gray-50/20' :
                  isRechazado ? 'border-red-200 bg-red-50/20' :
                  isEnRevision ? 'border-amber-200 bg-amber-50/10' :
                  'border-green-200 bg-green-50/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={statusToBadgeVariant(item.estado)}>{item.estado}</Badge>
                      {item.fechaActualizacion && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(item.fechaActualizacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Permit name */}
                    <h4 className="text-[14px] font-semibold text-slate-800">
                      {item.nombrePermiso}
                      {item.obligatorio && <span className="ml-2 text-[9px] font-bold text-red-500 uppercase">Obligatorio</span>}
                    </h4>

                    {/* Vigencia */}
                    {item.vigencia && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Vigencia: <span className="font-mono text-gray-500">{new Date(item.vigencia).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </p>
                    )}

                    {/* Admin comment — REQUIRED for Rechazado */}
                    {item.comentariosAdmin && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        isRechazado
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {isRechazado ? '⚠️ Motivo del Rechazo' : '💬 Comentario del Admin'}
                        </p>
                        <p className={`text-[12px] leading-relaxed font-medium ${
                          isRechazado ? 'text-slate-900' : 'text-slate-800'
                        }`}>
                          {item.comentariosAdmin}
                        </p>
                      </div>
                    )}

                    {/* Show warning if rejected without comment (shouldn't happen with our validation) */}
                    {isRechazado && !item.comentariosAdmin && (
                      <div className="mt-3 p-3 rounded-lg border bg-red-50 border-red-200">
                        <p className="text-[12px] text-red-600 italic">Rechazado sin comentario registrado.</p>
                      </div>
                    )}
                  </div>

                  {/* File button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {(item.estado === 'No Subido' || item.estado === 'Rechazado') && (
                      <Button size="sm" variant="primary" onClick={() => handleOpenUpload(item)}>
                        {item.estado === 'Rechazado' ? 'Reenviar' : 'Subir Documento'}
                      </Button>
                    )}
                    {item.archivoPath && (
                      <button
                        onClick={() => handleViewFile(item.archivoPath!)}
                        className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-all"
                        title="Ver documento"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={showUploadModal}
        onClose={() => {
          setPreviewUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
          setArchivo(null)
          setShowUploadModal(false)
        }}
        title={selectedItem?.estado === 'Rechazado' ? 'Reenvío de Documento' : 'Nueva Carga de Documento'}
        actions={
          <>
            <Button variant="secondary" onClick={() => { setArchivo(null); setShowUploadModal(false) }} disabled={submitting}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmitUpload} disabled={submitting || !vigencia || !archivo}>
              {submitting ? 'Enviando...' : 'Enviar a Revisión'}
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-[13px]">
                {submitError}
              </div>
            )}

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Subiendo</p>
              <h4 className="text-[15px] font-bold text-slate-800">{selectedItem.nombrePermiso}</h4>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Fecha de Vigencia Propuesta
              </label>
              <input
                type="date"
                value={vigencia}
                onChange={(e) => setVigencia(e.target.value)}
                min={todayStr}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-slate-700
                  focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Documento Probatorio (PDF o Imagen)
              </label>
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center
                  ${isDraggingUpload ? 'border-blue-400 bg-blue-50/40' : ''}
                  ${archivo ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingUpload(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingUpload(false) }}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload-historial"
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={(e) => validateAndSelectFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <label htmlFor="file-upload-historial" className="cursor-pointer">
                  {!archivo ? (
                    <div className="flex flex-col items-center">
                      <p className="text-[13px] font-semibold text-slate-700">Click para seleccionar o arrastra aquí</p>
                      <p className="text-[11px] text-gray-400 mt-1">Máximo 10MB • PDF, JPG, PNG, WEBP</p>
                    </div>
                  ) : previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-24 h-24 object-cover rounded-xl shadow-sm border border-green-200"
                      />
                      <p className="text-[13px] font-semibold text-green-700 truncate max-w-[200px]">{archivo.name}</p>
                      <p className="text-[11px] text-green-600/70">{(archivo.size / 1024 / 1024).toFixed(2)} MB • Imagen lista</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <p className="text-[13px] font-semibold text-green-700 truncate w-64 px-4">{archivo.name}</p>
                      <p className="text-[11px] text-green-600/70 mt-1">{(archivo.size / 1024 / 1024).toFixed(2)} MB • PDF listo para subir</p>
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
    </>
  )
}
