'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { CatalogoPermiso } from '@/types'
import {
  createCatalogoPermiso,
  deleteCatalogoPermiso,
  listCatalogoPermisosAdmin,
  updateCatalogoPermiso,
} from '@/lib/api/catalogo-permisos'

export interface PermisoFormValues {
  nombre_permiso: string
  ponderacion: number
}

export interface PermisoAdminRow extends CatalogoPermiso {
  tiendaCount: number
  vigenteCount: number
  solicitudCount: number
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
      setPermisos(await listCatalogoPermisosAdmin())
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar permisos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createPermiso = useCallback(
    async (values: PermisoFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validatePermisoForm(values)
      if (validationError) return { error: validationError }

      const result = await createCatalogoPermiso(buildPermisoPayload(values))
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const updatePermiso = useCallback(
    async (id: number, values: PermisoFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }

      const validationError = validatePermisoForm(values)
      if (validationError) return { error: validationError }

      const result = await updateCatalogoPermiso(id, buildPermisoPayload(values))
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
  )

  const deletePermiso = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const result = await deleteCatalogoPermiso(id)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [isAdmin, fetchAll],
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
