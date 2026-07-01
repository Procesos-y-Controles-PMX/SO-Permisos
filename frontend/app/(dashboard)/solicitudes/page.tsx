'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function SolicitudesPendientesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isAdmin, loading: authLoading } = useAuth()

  const [tiendas, setTiendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTiendasConPendientes = useCallback(async () => {
    if (!perfil) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Fetch all pending solicitudes with tienda info
      const { data, error: err } = await supabase
        .from('solicitudes')
        .select(`
          id,
          id_tienda,
          id_tipo_permiso,
          fecha_solicitud,
          estatus_solicitud,
          tienda:id_tienda(id, sucursal, gerente_tienda, region:id_region(nombre_region)),
          tipo_permiso:id_tipo_permiso(nombre_permiso)
        `)
        .eq('estatus_solicitud', 'Pendiente')
        .order('fecha_solicitud', { ascending: false })

      if (err) throw err

      // Group by id_tienda to get distinct tiendas with their pending count
      const tiendaMap = new Map<number, { tienda: any; pendientes: number; solicitudes: any[] }>()
      for (const s of data || []) {
        const tid = s.id_tienda
        if (!tiendaMap.has(tid)) {
          tiendaMap.set(tid, {
            tienda: s.tienda,
            pendientes: 0,
            solicitudes: [],
          })
        }
        const entry = tiendaMap.get(tid)!
        entry.pendientes++
        entry.solicitudes.push(s)
      }

      setTiendas(Array.from(tiendaMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil])

  useEffect(() => {
    if (!authLoading && perfil) fetchTiendasConPendientes()
  }, [authLoading, perfil, fetchTiendasConPendientes])

  // Non-admin redirect
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [authLoading, isAdmin, router])

  if (authLoading || loading) {
    return (
      <>
        <PageHeader eyebrow="Permisos" title="Solicitudes Pendientes" subtitle="Cargando..." />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><div className="h-20 rounded-lg bg-slate-100" /></Card>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Solicitudes Pendientes" subtitle="Error" />
        <Card className="text-center py-10"><p className="text-red-500 text-sm">❌ {error}</p></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Permisos"
        title="Solicitudes Pendientes"
        subtitle={`${tiendas.length} sucursal${tiendas.length !== 1 ? 'es' : ''} con documentos por revisar`}
      />

      {tiendas.length === 0 ? (
        <Card className="py-20 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-700">¡Todo al día!</p>
          <p className="mt-1 text-[13px] text-slate-500">No hay solicitudes pendientes de revisión.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tiendas.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer transition-all duration-200 hover:border-brand/30 hover:shadow-md"
              onClick={() => router.push(`/directorio/${item.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Store icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800 transition-colors group-hover:text-brand">
                      {item.tienda?.sucursal ?? 'Tienda desconocida'}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.tienda?.region?.nombre_region ?? 'Sin región'} • Gte: {item.tienda?.gerente_tienda ?? '—'}
                    </p>
                    {/* List of pending permit types */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.solicitudes.slice(0, 4).map((s: any) => (
                        <span key={s.id} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                          {s.tipo_permiso?.nombre_permiso}
                        </span>
                      ))}
                      {item.solicitudes.length > 4 && (
                        <span className="px-1 text-[10px] text-slate-400">+{item.solicitudes.length - 4} más</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="warning">{item.pendientes} pendiente{item.pendientes !== 1 ? 's' : ''}</Badge>
                  <span className="text-slate-300 transition-colors group-hover:text-brand">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
