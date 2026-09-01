'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatErrorMessage } from '@/lib/format-error'
import type { CatalogoPermiso, Region, Tienda } from '@/types'

export interface TiendaFormValues {
  sucursal: string
  id_region: number | null
  centro: string
  cc: string
  gerente_tienda: string
  celular: string
  correo: string
  direccion_sucursal: string
  permisosSeleccionados: number[]
}

export interface TiendaAdminRow extends Tienda {
  permisoCount: number
}

export interface RegionFormValues {
  nombre_region: string
  gerente_regional: string
  celular: string
  correo: string
}

export interface RegionAdminRow extends Pick<Region, 'id' | 'nombre_region' | 'gerente_regional' | 'celular' | 'correo'> {
  tiendaCount: number
  usuarioCount: number
}

const REGION_SEQUENCE_ERROR =
  'No se pudo crear la región por un conflicto de ID en la base de datos. Contacta al administrador para sincronizar la secuencia de regiones (ver db/fix-sequences.sql).'

function mapRegionInsertError(err: { code?: string; message: string }): string {
  if (err.code === '23505' && err.message.includes('regiones_pkey')) {
    return REGION_SEQUENCE_ERROR
  }
  return err.message
}

export function validateRegionForm(values: RegionFormValues): string | null {
  if (!values.nombre_region.trim()) return 'El nombre de la región es obligatorio.'
  if (!values.gerente_regional.trim()) return 'El gerente regional es obligatorio.'
  if (!values.correo.trim()) return 'El correo es obligatorio.'
  return null
}

export function buildRegionPayload(values: RegionFormValues) {
  return {
    nombre_region: values.nombre_region.trim(),
    gerente_regional: values.gerente_regional.trim(),
    celular: optionalString(values.celular),
    correo: values.correo.trim(),
  }
}

function optionalString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

async function checkDuplicateRegionName(
  supabase: ReturnType<typeof createClient>,
  nombre: string,
  excludeId?: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('regiones')
    .select('id, nombre_region')
    .ilike('nombre_region', nombre.trim())

  if (error) return error.message

  const duplicate = (data || []).find(
    (r) => r.nombre_region.trim().toLowerCase() === nombre.trim().toLowerCase() && r.id !== excludeId,
  )

  if (duplicate) {
    return 'Ya existe una región con ese nombre.'
  }

  return null
}

export function buildTiendaPayload(values: TiendaFormValues) {
  return {
    sucursal: values.sucursal.trim(),
    id_region: values.id_region,
    centro: optionalString(values.centro),
    cc: optionalString(values.cc),
    gerente_tienda: values.gerente_tienda.trim(),
    celular: optionalString(values.celular),
    correo: values.correo.trim(),
    direccion_sucursal: optionalString(values.direccion_sucursal),
  }
}

export function validateTiendaForm(values: TiendaFormValues): string | null {
  if (!values.sucursal.trim()) return 'El nombre de la sucursal es obligatorio.'
  if (!values.id_region) return 'Selecciona una región.'
  if (!values.gerente_tienda.trim()) return 'El gerente de tienda es obligatorio.'
  if (!values.correo.trim()) return 'El correo es obligatorio.'
  if (values.permisosSeleccionados.length === 0) {
    return 'Selecciona al menos un permiso del catálogo.'
  }
  return null
}

async function syncPermisosConfig(
  supabase: ReturnType<typeof createClient>,
  idTienda: number,
  selectedIds: number[],
): Promise<{ error: string | null }> {
  const { data: current, error: fetchErr } = await supabase
    .from('configuracion_tienda_permisos')
    .select('id_tipo_permiso')
    .eq('id_tienda', idTienda)

  if (fetchErr) return { error: fetchErr.message }

  const currentIds = new Set((current || []).map((r) => r.id_tipo_permiso as number))
  const selectedSet = new Set(selectedIds)

  const toRemove = [...currentIds].filter((id) => !selectedSet.has(id))
  const toAdd = selectedIds.filter((id) => !currentIds.has(id))

  for (const idTipo of toRemove) {
    const { error } = await supabase
      .from('configuracion_tienda_permisos')
      .delete()
      .eq('id_tienda', idTienda)
      .eq('id_tipo_permiso', idTipo)
    if (error) return { error: error.message }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from('configuracion_tienda_permisos').insert(
      toAdd.map((id_tipo_permiso) => ({
        id_tienda: idTienda,
        id_tipo_permiso,
        obligatorio: true,
      })),
    )
    if (error) return { error: error.message }
  }

  return { error: null }
}

interface UseSucursalesAdminReturn {
  tiendas: TiendaAdminRow[]
  regiones: RegionAdminRow[]
  catalogo: CatalogoPermiso[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getPermisosAsignados: (idTienda: number) => Promise<number[]>
  createRegion: (values: RegionFormValues) => Promise<{ error: string | null }>
  updateRegion: (id: number, values: RegionFormValues) => Promise<{ error: string | null }>
  deleteRegion: (id: number) => Promise<{ error: string | null }>
  createTienda: (values: TiendaFormValues) => Promise<{ error: string | null }>
  updateTienda: (id: number, values: TiendaFormValues) => Promise<{ error: string | null }>
  deleteTienda: (id: number) => Promise<{ error: string | null }>
}

export function useSucursalesAdmin(): UseSucursalesAdminReturn {
  const supabase = useMemo(() => createClient(), [])
  const { isAdmin, loading: authLoading } = useAuth()

  const [tiendas, setTiendas] = useState<TiendaAdminRow[]>([])
  const [regiones, setRegiones] = useState<RegionAdminRow[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoPermiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (authLoading) return

    if (!isAdmin) {
      setTiendas([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/sucursales', { cache: 'no-store' })
      const payload = (await response.json()) as {
        ok: boolean
        message?: string
        tiendas?: TiendaAdminRow[]
        regiones?: RegionAdminRow[]
        catalogo?: CatalogoPermiso[]
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Error al cargar sucursales')
      }

      setTiendas(payload.tiendas || [])
      setRegiones(payload.regiones || [])
      setCatalogo(payload.catalogo || [])
    } catch (e: unknown) {
      setError(formatErrorMessage(e, 'Error al cargar sucursales'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, authLoading])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const getPermisosAsignados = useCallback(
    async (idTienda: number) => {
      try {
        const response = await fetch(`/api/admin/sucursales/permisos?id_tienda=${idTienda}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as {
          ok: boolean
          permisos?: number[]
        }

        if (!response.ok || !payload.ok) return []
        return payload.permisos || []
      } catch {
        return []
      }
    },
    [],
  )

  const createRegion = useCallback(
    async (values: RegionFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validateRegionForm(values)
      if (validationError) return { error: validationError }

      const duplicateError = await checkDuplicateRegionName(supabase, values.nombre_region)
      if (duplicateError) return { error: duplicateError }

      const payload = buildRegionPayload(values)

      const { error: insertErr } = await supabase.from('regiones').insert(payload)

      if (insertErr) return { error: mapRegionInsertError(insertErr) }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const updateRegion = useCallback(
    async (id: number, values: RegionFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validateRegionForm(values)
      if (validationError) return { error: validationError }

      const duplicateError = await checkDuplicateRegionName(supabase, values.nombre_region, id)
      if (duplicateError) return { error: duplicateError }

      const payload = buildRegionPayload(values)

      const { error: updateErr } = await supabase.from('regiones').update(payload).eq('id', id)

      if (updateErr) return { error: updateErr.message }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const deleteRegion = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const { data: tiendasLinked, error: tiendasErr } = await supabase
        .from('tiendas')
        .select('id')
        .eq('id_region', id)

      if (tiendasErr) return { error: tiendasErr.message }

      const tiendaCount = (tiendasLinked || []).length
      if (tiendaCount > 0) {
        return {
          error: `No se puede eliminar: hay ${tiendaCount} sucursal${tiendaCount !== 1 ? 'es' : ''} en esta región. Reasígnalas o elimínalas primero.`,
        }
      }

      const { data: users, error: usersErr } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id_region', id)

      if (usersErr) return { error: usersErr.message }

      const usuarioCount = (users || []).length
      if (usuarioCount > 0) {
        return {
          error: `No se puede eliminar: hay ${usuarioCount} usuario${usuarioCount !== 1 ? 's' : ''} Regional asignado${usuarioCount !== 1 ? 's' : ''}. Reasígnalos en Usuarios primero.`,
        }
      }

      const { error: delErr } = await supabase.from('regiones').delete().eq('id', id)

      if (delErr) {
        if (delErr.code === '23503') {
          return {
            error:
              'No se puede eliminar la región porque tiene datos relacionados. Revisa sucursales o usuarios vinculados.',
          }
        }
        return { error: delErr.message }
      }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const createTienda = useCallback(
    async (values: TiendaFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validateTiendaForm(values)
      if (validationError) return { error: validationError }

      const payload = buildTiendaPayload(values)

      const { data: inserted, error: insertErr } = await supabase
        .from('tiendas')
        .insert(payload)
        .select('id')
        .single()

      if (insertErr) return { error: insertErr.message }
      if (!inserted?.id) return { error: 'No se pudo crear la sucursal.' }

      const syncResult = await syncPermisosConfig(
        supabase,
        inserted.id as number,
        values.permisosSeleccionados,
      )
      if (syncResult.error) {
        await supabase.from('tiendas').delete().eq('id', inserted.id)
        return { error: syncResult.error }
      }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const updateTienda = useCallback(
    async (id: number, values: TiendaFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validateTiendaForm(values)
      if (validationError) return { error: validationError }

      const payload = buildTiendaPayload(values)

      const { error: updateErr } = await supabase.from('tiendas').update(payload).eq('id', id)

      if (updateErr) return { error: updateErr.message }

      const syncResult = await syncPermisosConfig(supabase, id, values.permisosSeleccionados)
      if (syncResult.error) return { error: syncResult.error }

      await fetchAll()
      return { error: null }
    },
    [supabase, isAdmin, fetchAll],
  )

  const deleteTienda = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const { data: users, error: usersErr } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id_tienda', id)

      if (usersErr) return { error: usersErr.message }

      if ((users || []).length > 0) {
        const n = users!.length
        return {
          error: `No se puede eliminar: hay ${n} usuario${n !== 1 ? 's' : ''} asignado${n !== 1 ? 's' : ''} a esta sucursal. Reasígnalos o elimínalos primero.`,
        }
      }

      const { error: delErr } = await supabase.from('tiendas').delete().eq('id', id)

      if (delErr) {
        if (delErr.code === '23503') {
          return {
            error:
              'No se puede eliminar la sucursal porque tiene datos relacionados. Revisa usuarios u otras referencias.',
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
    tiendas,
    regiones,
    catalogo,
    loading,
    error,
    refetch: fetchAll,
    getPermisosAsignados,
    createRegion,
    updateRegion,
    deleteRegion,
    createTienda,
    updateTienda,
    deleteTienda,
  }
}
