'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getFileUrl } from '@/lib/storage'

export default function HistorialPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isTienda, loading: authLoading } = useAuth()

  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEstatus, setFilterEstatus] = useState('')

  const fetchHistorial = useCallback(async () => {
    if (!perfil || !perfil.id_tienda) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('solicitudes')
        .select(`
          *,
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .eq('id_tienda', perfil.id_tienda)
        .order('fecha_solicitud', { ascending: false })

      if (err) throw err
      setSolicitudes(data || [])
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

  const filtered = solicitudes.filter(s => {
    if (!filterEstatus) return true
    return s.estatus_solicitud === filterEstatus
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
  const countPendiente = solicitudes.filter(s => s.estatus_solicitud === 'Pendiente').length
  const countAprobado = solicitudes.filter(s => s.estatus_solicitud === 'Aprobado').length
  const countRechazado = solicitudes.filter(s => s.estatus_solicitud === 'Rechazado').length

  return (
    <>
      <PageHeader
        title="Historial de Solicitudes"
        subtitle="Resultados y notificaciones de tus documentos"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'Pendiente' ? '' : 'Pendiente')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'Pendiente'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-amber-200'
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{countPendiente}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">En Revisión</p>
        </button>
        <button
          onClick={() => setFilterEstatus(filterEstatus === 'Aprobado' ? '' : 'Aprobado')}
          className={`rounded-xl p-4 text-center transition-all border ${
            filterEstatus === 'Aprobado'
              ? 'bg-green-50 border-green-300 shadow-sm'
              : 'bg-white border-gray-100 hover:border-green-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{countAprobado}</p>
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
          {filtered.map((s) => {
            const isRechazado = s.estatus_solicitud === 'Rechazado'
            const isPendiente = s.estatus_solicitud === 'Pendiente'

            return (
              <Card
                key={s.id}
                className={`transition-all duration-200 ${
                  isRechazado ? 'border-red-200 bg-red-50/20' :
                  isPendiente ? 'border-amber-200 bg-amber-50/10' :
                  'border-green-200 bg-green-50/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={statusToBadgeVariant(s.estatus_solicitud)}>{s.estatus_solicitud}</Badge>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(s.fecha_solicitud).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Permit name */}
                    <h4 className="text-[14px] font-semibold text-slate-800">
                      {s.tipo_permiso?.nombre_permiso ?? 'Permiso desconocido'}
                    </h4>

                    {/* Vigencia */}
                    {s.vigencia_propuesta && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Vigencia propuesta: <span className="font-mono text-gray-500">{new Date(s.vigencia_propuesta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </p>
                    )}

                    {/* Admin comment — REQUIRED for Rechazado */}
                    {s.comentarios_admin && (
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
                          {s.comentarios_admin}
                        </p>
                      </div>
                    )}

                    {/* Show warning if rejected without comment (shouldn't happen with our validation) */}
                    {isRechazado && !s.comentarios_admin && (
                      <div className="mt-3 p-3 rounded-lg border bg-red-50 border-red-200">
                        <p className="text-[12px] text-red-600 italic">Rechazado sin comentario registrado.</p>
                      </div>
                    )}
                  </div>

                  {/* File button */}
                  {s.archivo_adjunto_path && (
                    <button
                      onClick={() => handleViewFile(s.archivo_adjunto_path)}
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
