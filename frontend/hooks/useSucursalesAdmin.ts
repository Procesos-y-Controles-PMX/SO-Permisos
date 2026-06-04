'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
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

function optionalString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function buildTiendaPayload(values: TiendaFormValues) {
  return {
    sucursal: values.sucursal.trim(),
    id_region: values.id_region,
    centro: optionalString(values.centro),
    cc: optionalString(values.cc),
    gerente_tienda: optionalString(values.gerente_tienda),
    celular: optionalString(values.celular),
    correo: optionalString(values.correo),
    direccion_sucursal: optionalString(values.direccion_sucursal),
  }
}

export function validateTiendaForm(values: TiendaFormValues): string | null {
  if (!values.sucursal.trim()) return 'El nombre de la sucursal es obligatorio.'
  if (!values.id_region) return 'Selecciona una región.'
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
  regiones: Pick<Region, 'id' | 'nombre_region'>[]
  catalogo: CatalogoPermiso[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getPermisosAsignados: (idTienda: number) => Promise<number[]>
  createTienda: (values: TiendaFormValues) => Promise<{ error: string | null }>
  updateTienda: (id: number, values: TiendaFormValues) => Promise<{ error: string | null }>
  deleteTienda: (id: number) => Promise<{ error: string | null }>
}

export function useSucursalesAdmin(): UseSucursalesAdminReturn {
  const supabase = useMemo(() => createClient(), [])
  const { isAdmin } = useAuth()

  const [tiendas, setTiendas] = useState<TiendaAdminRow[]>([])
  const [regiones, setRegiones] = useState<Pick<Region, 'id' | 'nombre_region'>[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoPermiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!isAdmin) {
      setTiendas([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [tiendasRes, regionesRes, catalogoRes, configRes] = await Promise.all([
        supabase
          .from('tiendas')
          .select('*, region:id_region(id, nombre_region)')
          .order('sucursal'),
        supabase.from('regiones').select('id, nombre_region').order('nombre_region'),
        supabase.from('catalogo_permisos').select('id, nombre_permiso, ponderacion').order('nombre_permiso'),
        supabase.from('configuracion_tienda_permisos').select('id_tienda'),
      ])

      if (tiendasRes.error) throw tiendasRes.error
      if (regionesRes.error) throw regionesRes.error
      if (catalogoRes.error) throw catalogoRes.error
      if (configRes.error) throw configRes.error

      const countByTienda = new Map<number, number>()
      ;(configRes.data || []).forEach((row) => {
        const tid = row.id_tienda as number
        countByTienda.set(tid, (countByTienda.get(tid) || 0) + 1)
      })

      const rows: TiendaAdminRow[] = (tiendasRes.data || []).map((t) => ({
        ...(t as Tienda),
        permisoCount: countByTienda.get((t as Tienda).id) || 0,
      }))

      setTiendas(rows)
      setRegiones((regionesRes.data || []) as Pick<Region, 'id' | 'nombre_region'>[])
      setCatalogo((catalogoRes.data || []) as CatalogoPermiso[])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar sucursales'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase, isAdmin])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const getPermisosAsignados = useCallback(
    async (idTienda: number) => {
      const { data, error: err } = await supabase
        .from('configuracion_tienda_permisos')
        .select('id_tipo_permiso')
        .eq('id_tienda', idTienda)

      if (err) return []
      return (data || []).map((r) => r.id_tipo_permiso as number)
    },
    [supabase],
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
    createTienda,
    updateTienda,
    deleteTienda,
  }
}
