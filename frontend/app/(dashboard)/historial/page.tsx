'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getFileUrl } from '@/lib/storage'
import type { HistorialPermisoEstado } from '@/types'

interface HistorialPermisoItem {
  idTipoPermiso: number
  nombrePermiso: string
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

  const [items, setItems] = useState<HistorialPermisoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEstatus, setFilterEstatus] = useState<HistorialPermisoEstado | ''>('')

  const fetchHistorial = useCallback(async () => {
    if (!perfil || !perfil.id_tienda) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { data: configData, error: configErr } = await supabase
        .from('configuracion_tienda_permisos')
        .select(`
          id_tipo_permiso,
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
            idTipoPermiso,
            nombrePermiso,
            estado: 'En Revisión',
            fechaActualizacion: pendiente.fecha_solicitud || null,
            vigencia: pendiente.vigencia_propuesta || null,
            archivoPath: pendiente.archivo_adjunto_path || null,
            comentariosAdmin: null,
          }
        }

        if (ultimaSolicitud?.estatus_solicitud === 'Rechazado') {
          return {
            idTipoPermiso,
            nombrePermiso,
            estado: 'Rechazado',
            fechaActualizacion: ultimaSolicitud.fecha_solicitud || null,
            vigencia: ultimaSolicitud.vigencia_propuesta || null,
            archivoPath: ultimaSolicitud.archivo_adjunto_path || null,
            comentariosAdmin: ultimaSolicitud.comentarios_admin || null,
          }
        }

        if (vigente && activeStatuses.has(vigente.estatus) && !isExpired) {
          return {
            idTipoPermiso,
            nombrePermiso,
            estado: 'Aceptado',
            fechaActualizacion: vigente.ultima_actualizacion || null,
            vigencia: vigente.fecha_vencimiento || null,
            archivoPath: vigente.archivo_path || null,
            comentariosAdmin: null,
          }
        }

        return {
          idTipoPermiso,
          nombrePermiso,
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
                  {item.archivoPath && (
                    <button
                      onClick={() => handleViewFile(item.archivoPath!)}
                      className="shrink-0 p-2.5 rounded-xl text-blue-500 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-all"
                      title="Ver documento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
