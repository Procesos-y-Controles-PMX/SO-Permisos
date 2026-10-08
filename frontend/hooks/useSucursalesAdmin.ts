'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { CatalogoPermiso, Region, Tienda } from '@/types'
import {
  createRegion as createRegionApi,
  createTienda as createTiendaApi,
  deleteRegion as deleteRegionApi,
  deleteTienda as deleteTiendaApi,
  getPermisosAsignados as getPermisosAsignadosApi,
  listSucursalesCatalog,
  updateRegion as updateRegionApi,
  updateTienda as updateTiendaApi,
} from '@/lib/api/sucursales'

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

export function validateRegionForm(values: RegionFormValues): string | null {
  if (!values.nombre_region.trim()) return 'El nombre de la región es obligatorio.'
  if (!values.gerente_regional.trim()) return 'El gerente regional es obligatorio.'
  if (!values.correo.trim()) return 'El correo es obligatorio.'
  return null
}

function optionalString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function buildRegionPayload(values: RegionFormValues) {
  return {
    nombre_region: values.nombre_region.trim(),
    gerente_regional: values.gerente_regional.trim(),
    celular: optionalString(values.celular),
    correo: values.correo.trim(),
  }
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
  const { isAdmin } = useAuth()

  const [tiendas, setTiendas] = useState<TiendaAdminRow[]>([])
  const [regiones, setRegiones] = useState<RegionAdminRow[]>([])
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
      const catalog = await listSucursalesCatalog()
      setTiendas(catalog.tiendas)
      setRegiones(catalog.regiones)
      setCatalogo(catalog.catalogo)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar sucursales'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const getPermisosAsignados = useCallback(async (idTienda: number) => {
    return getPermisosAsignadosApi(idTienda)
  }, [])

  const createRegion = useCallback(
    async (values: RegionFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const validationError = validateRegionForm(values)
      if (validationError) return { error: validationError }
      const result = await createRegionApi(buildRegionPayload(values))
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const updateRegion = useCallback(
    async (id: number, values: RegionFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const validationError = validateRegionForm(values)
      if (validationError) return { error: validationError }
      const result = await updateRegionApi(id, buildRegionPayload(values))
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const deleteRegion = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const result = await deleteRegionApi(id)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const createTienda = useCallback(
    async (values: TiendaFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const validationError = validateTiendaForm(values)
      if (validationError) return { error: validationError }
      const result = await createTiendaApi(buildTiendaPayload(values), values.permisosSeleccionados)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const updateTienda = useCallback(
    async (id: number, values: TiendaFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const validationError = validateTiendaForm(values)
      if (validationError) return { error: validationError }
      const result = await updateTiendaApi(id, buildTiendaPayload(values), values.permisosSeleccionados)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const deleteTienda = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const result = await deleteTiendaApi(id)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
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
