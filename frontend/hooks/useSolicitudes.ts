'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { promoteFile } from '@/lib/storage'

interface UseSolicitudesReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  aprobar: (id: number, comentarios?: string) => Promise<{ error: string | null }>
  rechazar: (id: number, comentarios: string) => Promise<{ error: string | null }>
  crearSolicitud: (payload: {
    id_tienda: number
    id_tipo_permiso: number
    vigencia_propuesta: string
    archivo_adjunto_path: string | null
  }) => Promise<{ error: string | null }>
}

export function useSolicitudes(idTienda?: number): UseSolicitudesReturn {
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isTienda, isRegional } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!perfil) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          tienda:id_tienda(id, sucursal),
          tipo_permiso:id_tipo_permiso(id, nombre_permiso)
        `)
        .order('fecha_solicitud', { ascending: false })

      // If a specific tienda ID is passed, filter by it (for detail view)
      if (idTienda) {
        query = query.eq('id_tienda', idTienda)
      } else if (isTienda && perfil.id_tienda) {
        query = query.eq('id_tienda', perfil.id_tienda)
      } else if (isRegional && perfil.id_region) {
        const { data: tiendasRegion } = await supabase
          .from('tiendas')
          .select('id')
          .eq('id_region', perfil.id_region)

        if (tiendasRegion && tiendasRegion.length > 0) {
          query = query.in('id_tienda', tiendasRegion.map(t => t.id))
        }
      }

      const { data: result, error: err } = await query
      if (err) throw err
      setData(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, perfil, isTienda, isRegional, idTienda])

  useEffect(() => {
    if (perfil) fetch()
  }, [perfil, fetch])

  // ─ Aprobar Solicitud ─
  const aprobar = async (id: number, comentarios?: string) => {
    console.log(`[useSolicitudes] Iniciando aprobación de solicitud ID: ${id}`)
    try {
      // 1. Update solicitud as 'Aprobado' and get details
      const { data: updatedSolicitud, error: err } = await supabase
        .from('solicitudes')
        .update({
          estatus_solicitud: 'Aprobado',
          comentarios_admin: comentarios || null,
          id_admin_revisor: perfil?.id ?? null,
        })
        .eq('id', id)
        .select(`
          *,
          tipo_permiso:id_tipo_permiso(nombre_permiso)
        `)
        .single()

      if (err) throw err
      if (!updatedSolicitud) throw new Error('No se encontró la solicitud aprobada.')

      console.log('[useSolicitudes] Datos de solicitud aprobada:', {
        tienda: updatedSolicitud.id_tienda,
        tipo_permiso: updatedSolicitud.id_tipo_permiso,
        nombre: updatedSolicitud.tipo_permiso?.nombre_permiso
      })

      // 2. VALIDATION: Check if this pair exists in configuration (prevents FK violation)
      const { data: configCheck, error: configErr } = await supabase
        .from('configuracion_tienda_permisos')
        .select('id')
        .eq('id_tienda', updatedSolicitud.id_tienda)
        .eq('id_tipo_permiso', updatedSolicitud.id_tipo_permiso)
        .single()

      if (configErr || !configCheck) {
        console.error('[useSolicitudes] Error de validación: El permiso no está configurado para esta tienda.', configErr)
        throw new Error('El permiso no está configurado para esta tienda (FK check failed).')
      }

      console.log('[useSolicitudes] Configuración válida encontrada ID:', configCheck.id)

      let finalPath = updatedSolicitud.archivo_adjunto_path

      // 3. Move file to 'activos' folder if it exists and is in 'solicitudes'
      if (finalPath && finalPath.startsWith('solicitudes/')) {
        const { newPath, error: moveErr } = await promoteFile(
          finalPath,
          updatedSolicitud.id_tienda,
          updatedSolicitud.tipo_permiso?.nombre_permiso || 'Permiso'
        )
        if (moveErr) throw new Error(`Error al mover archivo: ${moveErr}`)
        finalPath = newPath

        // Update the solicitud record with the new final path
        await supabase
          .from('solicitudes')
          .update({ archivo_adjunto_path: finalPath })
          .eq('id', updatedSolicitud.id)
      }

      // 4. MANUAL UPSERT into permisos_vigentes (fixes "ON CONFLICT" error)
      console.log('[useSolicitudes] Buscando registro existente en permisos_vigentes...')
      const { data: existingVigente } = await supabase
        .from('permisos_vigentes')
        .select('id')
        .eq('id_tienda', updatedSolicitud.id_tienda)
        .eq('id_tipo_permiso', updatedSolicitud.id_tipo_permiso)
        .maybeSingle()

      const payloadVigente = {
        id_tienda: updatedSolicitud.id_tienda,
        id_tipo_permiso: updatedSolicitud.id_tipo_permiso,
        fecha_vencimiento: updatedSolicitud.vigencia_propuesta,
        estatus: 'Aprobado',
        archivo_path: finalPath,
        puntaje: 1,
        ultima_actualizacion: new Date().toISOString(),
      }

      let vigenteErr
      if (existingVigente) {
        console.log('[useSolicitudes] Registro encontrado (ID: ' + existingVigente.id + '). Realizando UPDATE...')
        const { error } = await supabase
          .from('permisos_vigentes')
          .update(payloadVigente)
          .eq('id', existingVigente.id)
        vigenteErr = error
      } else {
        console.log('[useSolicitudes] Registro no encontrado. Realizando INSERT...')
        const { error } = await supabase
          .from('permisos_vigentes')
          .insert(payloadVigente)
        vigenteErr = error
      }

      if (vigenteErr) {
        console.error('[useSolicitudes] Error en persistencia de permisos_vigentes:', vigenteErr)
        throw vigenteErr
      }

      await fetch()
      return { error: null }
    } catch (e: any) {
      console.error('[useSolicitudes] Error fatal en aprobación:', e.message)
      return { error: e.message }
    }
  }

  // ─ Rechazar Solicitud ─
  const rechazar = async (id: number, comentarios: string) => {
    try {
      const { error: err } = await supabase
        .from('solicitudes')
        .update({
          estatus_solicitud: 'Rechazado',
          comentarios_admin: comentarios,
          id_admin_revisor: perfil?.id ?? null,
        })
        .eq('id', id)

      if (err) throw err
      await fetch()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  // ─ Crear Solicitud ─
  const crearSolicitud = async (payload: {
    id_tienda: number
    id_tipo_permiso: number
    vigencia_propuesta: string
    archivo_adjunto_path: string | null
  }) => {
    try {
      const { error: err } = await supabase
        .from('solicitudes')
        .insert({
          ...payload,
          estatus_solicitud: 'Pendiente',
        })

      if (err) throw err
      await fetch()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  // ─ Real-time ─
  useEffect(() => {
    const channel = supabase.channel('solicitudes-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        () => {
          console.log('[useSolicitudes] Real-time update triggered')
          fetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetch])

  return { data, loading, error, refetch: fetch, aprobar, rechazar, crearSolicitud }
}
