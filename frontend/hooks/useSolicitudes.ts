'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { deleteFile, promoteFile } from '@/lib/storage'

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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  const { perfil, isTienda, isRegional } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isPastDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return false
    const target = new Date(dateValue)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return target < today
  }
  const isExpiredDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return false
    const target = new Date(dateValue)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return target < today
  }

  const notifyBackend = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!apiBaseUrl) {
        console.warn('[useSolicitudes] NEXT_PUBLIC_API_URL no esta configurada, se omite notificacion backend.')
        return
      }

      try {
        const response = await fetch(`${apiBaseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const message = await response.text()
          console.warn(`[useSolicitudes] Notificacion backend fallo (${path}):`, message)
        }
      } catch (error) {
        console.warn(`[useSolicitudes] Error enviando notificacion (${path}):`, error)
      }
    },
    [apiBaseUrl]
  )

  const fetchSolicitudes = useCallback(async () => {
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
    if (perfil) fetchSolicitudes()
  }, [perfil, fetchSolicitudes])

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
      const expiredAtApproval = isExpiredDate(updatedSolicitud.vigencia_propuesta)

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

      // 3.1 If approved with an already expired date, keep DB as expired and purge storage file.
      if (expiredAtApproval && finalPath) {
        const { error: deleteErr } = await deleteFile(finalPath)
        if (deleteErr) {
          console.warn('[useSolicitudes] No se pudo eliminar archivo vencido tras aprobación:', deleteErr)
        }
        finalPath = null
        await supabase
          .from('solicitudes')
          .update({ archivo_adjunto_path: null })
          .eq('id', updatedSolicitud.id)
      }

      // 4. MANUAL UPSERT into permisos_vigentes (fixes "ON CONFLICT" error)
      console.log('[useSolicitudes] Buscando registro existente en permisos_vigentes...')
      const { data: existingVigentes, error: findErr } = await supabase
        .from('permisos_vigentes')
        .select('id')
        .eq('id_tienda', updatedSolicitud.id_tienda)
        .eq('id_tipo_permiso', updatedSolicitud.id_tipo_permiso)
        .order('id', { ascending: false })

      if (findErr) throw findErr

      const payloadVigente = {
        id_tienda: updatedSolicitud.id_tienda,
        id_tipo_permiso: updatedSolicitud.id_tipo_permiso,
        fecha_vencimiento: updatedSolicitud.vigencia_propuesta,
        estatus: expiredAtApproval ? 'Vencido' : 'Activo',
        archivo_path: finalPath,
        puntaje: 1,
        ultima_actualizacion: new Date().toISOString(),
      }

      let vigenteErr
      if ((existingVigentes || []).length > 0) {
        console.log('[useSolicitudes] Registro(s) encontrado(s). Realizando UPDATE...')
        const { error } = await supabase
          .from('permisos_vigentes')
          .update(payloadVigente)
          .eq('id_tienda', updatedSolicitud.id_tienda)
          .eq('id_tipo_permiso', updatedSolicitud.id_tipo_permiso)
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

      await notifyBackend('/api/v1/notificaciones/solicitud-resuelta', {
        id_solicitud: id,
        estatus: 'Aprobado',
        comentarios: comentarios || null,
      })

      await fetchSolicitudes()
      return { error: null }
    } catch (e: any) {
      console.error('[useSolicitudes] Error fatal en aprobación:', e.message)
      return { error: e.message }
    }
  }

  // ─ Rechazar Solicitud ─
  const rechazar = async (id: number, comentarios: string) => {
    try {
      const { data: solicitud, error: getErr } = await supabase
        .from('solicitudes')
        .select('id_tienda, id_tipo_permiso')
        .eq('id', id)
        .single()

      if (getErr) throw getErr

      const { error: err } = await supabase
        .from('solicitudes')
        .update({
          estatus_solicitud: 'Rechazado',
          comentarios_admin: comentarios,
          id_admin_revisor: perfil?.id ?? null,
        })
        .eq('id', id)

      if (err) throw err

      const payload = {
        id_tienda: solicitud.id_tienda,
        id_tipo_permiso: solicitud.id_tipo_permiso,
        estatus: 'Vencido',
        archivo_path: null,
        ultima_actualizacion: new Date().toISOString(),
      }

      const { data: existingVigentes, error: findErr } = await supabase
        .from('permisos_vigentes')
        .select('id')
        .eq('id_tienda', solicitud.id_tienda)
        .eq('id_tipo_permiso', solicitud.id_tipo_permiso)

      if (findErr) throw findErr

      let vigenteErr = null
      if ((existingVigentes || []).length > 0) {
        const { error } = await supabase
          .from('permisos_vigentes')
          .update(payload)
          .eq('id_tienda', solicitud.id_tienda)
          .eq('id_tipo_permiso', solicitud.id_tipo_permiso)
        vigenteErr = error
      } else {
        const { error } = await supabase
          .from('permisos_vigentes')
          .insert(payload)
        vigenteErr = error
      }

      if (vigenteErr) throw vigenteErr

      await notifyBackend('/api/v1/notificaciones/solicitud-resuelta', {
        id_solicitud: id,
        estatus: 'Rechazado',
        comentarios,
      })

      await fetchSolicitudes()
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
      if (isPastDate(payload.vigencia_propuesta)) {
        throw new Error('La vigencia propuesta no puede ser anterior al día de hoy.')
      }

      const { data: nuevaSolicitud, error: err } = await supabase
        .from('solicitudes')
        .insert({
          ...payload,
          estatus_solicitud: 'Pendiente',
        })
        .select('id')
        .single()

      if (err) throw err

      const payloadVigente = {
        id_tienda: payload.id_tienda,
        id_tipo_permiso: payload.id_tipo_permiso,
        fecha_vencimiento: payload.vigencia_propuesta,
        estatus: 'Pendiente',
        archivo_path: null,
        ultima_actualizacion: new Date().toISOString(),
      }

      const { data: existingVigentes, error: findErr } = await supabase
        .from('permisos_vigentes')
        .select('id')
        .eq('id_tienda', payload.id_tienda)
        .eq('id_tipo_permiso', payload.id_tipo_permiso)

      if (findErr) throw findErr

      let vigenteErr = null
      if ((existingVigentes || []).length > 0) {
        const { error } = await supabase
          .from('permisos_vigentes')
          .update(payloadVigente)
          .eq('id_tienda', payload.id_tienda)
          .eq('id_tipo_permiso', payload.id_tipo_permiso)
        vigenteErr = error
      } else {
        const { error } = await supabase
          .from('permisos_vigentes')
          .insert(payloadVigente)
        vigenteErr = error
      }

      if (vigenteErr) throw vigenteErr

      if (nuevaSolicitud?.id) {
        await notifyBackend('/api/v1/notificaciones/solicitud-creada', {
          id_solicitud: nuevaSolicitud.id,
        })
      }

      await fetchSolicitudes()
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
          fetchSolicitudes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchSolicitudes])

  return { data, loading, error, refetch: fetchSolicitudes, aprobar, rechazar, crearSolicitud }
}
