'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CatalogoPermiso } from '@/types'

export interface PermisoFormValues {
  nombre_permiso: string
  ponderacion: number
}

export interface PermisoAdminRow extends CatalogoPermiso {
  tiendaCount: number
  vigenteCount: number
  solicitudCount: number
}

const PERMISO_SEQUENCE_ERROR =
  'No se pudo crear el permiso por un conflicto de ID en la base de datos. Contacta al administrador para sincronizar la secuencia de catalogo_permisos (ver db/fix-sequences.sql).'

function mapPermisoInsertError(err: { code?: string; message: string }): string {
  if (err.code === '23505' && err.message.includes('catalogo_permisos_pkey')) {
    return PERMISO_SEQUENCE_ERROR
  }
  return err.message
}

export function validatePermisoForm(values: PermisoFormValues): string | null {
  if (!values.nombre_permiso.trim()) return 'El nombre del permiso es obligatorio.'
  if (!Number.isFinite(values.ponderacion) || values.ponderacion < 1) {
    return 'La ponderación debe ser un número entero mayor o igual a 1.'
  }
  if (!Number.isInteger(values.ponderacion)) {
    return 'La ponderación debe ser un número entero.'
  }
  return null
}

export function buildPermisoPayload(values: PermisoFormValues) {
  return {
    nombre_permiso: values.nombre_permiso.trim(),
    ponderacion: values.ponderacion,
  }
}

async function checkDuplicatePermisoName(
  supabase: ReturnType<typeof createClient>,
  nombre: string,
  excludeId?: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('catalogo_permisos')
    .select('id, nombre_permiso')
    .ilike('nombre_permiso', nombre.trim())

  if (error) return error.message

  const duplicate = (data || []).find(
    (p) =>
      p.nombre_permiso.trim().toLowerCase() === nombre.trim().toLowerCase() &&
      p.id !== excludeId,
  )

  if (duplicate) return 'Ya existe un permiso con ese nombre.'

  return null
}

interface UsePermisosAdminReturn {
  permisos: PermisoAdminRow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createPermiso: (values: PermisoFormValues) => Promise<{ error: string | null }>
  updatePermiso: (id: number, values: PermisoFormValues) => Promise<{ error: string | null }>
  deletePermiso: (id: number) => Promise<{ error: string | null }>
}

export function usePermisosAdmin(): UsePermisosAdminReturn {
  const supabase = useMemo(() => createClient(), [])
  const { isAdmin } = useAuth()

  const [permisos, setPermisos] = useState<PermisoAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!isAdmin) {
      setPermisos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [catalogoRes, configRes, vigentesRes, solicitudesRes] = await Promise.all([
        supabase
          .from('catalogo_permisos')
          .select('id, nombre_permiso, ponderacion')
          .order('nombre_permiso'),
        supabase.from('configuracion_tienda_permisos').select('id_tipo_permiso, id_tienda'),
        supabase.from('permisos_vigentes').select('id_tipo_permiso'),
        supabase.from('solicitudes').select('id_tipo_permiso'),
      ])

      if (catalogoRes.error) throw catalogoRes.error
      if (configRes.error) throw configRes.error
      if (vigentesRes.error) throw vigentesRes.error
      if (solicitudesRes.error) throw solicitudesRes.error

      const tiendasByPermiso = new Map<number, Set<number>>()
      ;(configRes.data || []).forEach((row) => {
        const idTipo = row.id_tipo_permiso as number
        const idTienda = row.id_tienda as number
        if (!tiendasByPermiso.has(idTipo)) tiendasByPermiso.set(idTipo, new Set())
        tiendasByPermiso.get(idTipo)!.add(idTienda)
      })

      const vigentesByPermiso = new Map<number, number>()
      ;(vigentesRes.data || []).forEach((row) => {
        const idTipo = row.id_tipo_permiso as number
        vigentesByPermiso.set(idTipo, (vigentesByPermiso.get(idTipo) || 0) + 1)
      })

      const solicitudesByPermiso = new Map<number, number>()
      ;(solicitudesRes.data || []).forEach((row) => {
        const idTipo = row.id_tipo_permiso as number
        solicitudesByPermiso.set(idTipo, (solicitudesByPermiso.get(idTipo) || 0) + 1)
      })

      const rows: PermisoAdminRow[] = (catalogoRes.data || []).map((p) => ({
        ...(p as CatalogoPermiso),
        tiendaCount: tiendasByPermiso.get((p as CatalogoPermiso).id)?.size || 0,
        vigenteCount: vigentesByPermiso.get((p as CatalogoPermiso).id) || 0,
        solicitudCount: solicitudesByPermiso.get((p as CatalogoPermiso).id) || 0,
      }))

      setPermisos(rows)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar permisos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase, isAdmin])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createPermiso = useCallback(
    async (values: PermisoFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validatePermisoForm(values)
      if (validationError) return { error: validationError }

      const duplicateError = await checkDuplicatePermisoName(supabase, values.nombre_permiso)
      if (duplicateError) return { error: duplicateError }

      const payload = buildPermisoPayload(values)

      const { error: insertErr } = await supabase.from('catalogo_permisos').insert(payload)

      if (insertErr) return { error: mapPermisoInsertError(insertErr) }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const updatePermiso = useCallback(
    async (id: number, values: PermisoFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validatePermisoForm(values)
      if (validationError) return { error: validationError }

      const duplicateError = await checkDuplicatePermisoName(supabase, values.nombre_permiso, id)
      if (duplicateError) return { error: duplicateError }

      const payload = buildPermisoPayload(values)

      const { error: updateErr } = await supabase
        .from('catalogo_permisos')
        .update(payload)
        .eq('id', id)

      if (updateErr) return { error: updateErr.message }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const deletePermiso = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const { error: solicitudesErr } = await supabase
        .from('solicitudes')
        .delete()
        .eq('id_tipo_permiso', id)

      if (solicitudesErr) return { error: solicitudesErr.message }

      const { error: vigentesErr } = await supabase
        .from('permisos_vigentes')
        .delete()
        .eq('id_tipo_permiso', id)

      if (vigentesErr) return { error: vigentesErr.message }

      const { error: configErr } = await supabase
        .from('configuracion_tienda_permisos')
        .delete()
        .eq('id_tipo_permiso', id)

      if (configErr) return { error: configErr.message }

      const { error: delErr } = await supabase.from('catalogo_permisos').delete().eq('id', id)

      if (delErr) {
        if (delErr.code === '23503') {
          return {
            error:
              'No se puede eliminar el permiso porque tiene datos relacionados. Revisa referencias pendientes.',
          }
        }
        return { error: delErr.message }
      }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  return {
    permisos,
    loading,
    error,
    refetch: fetchAll,
    createPermiso,
    updatePermiso,
    deletePermiso,
  }
}
