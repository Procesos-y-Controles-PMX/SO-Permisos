'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Perfil, PerfilFormValues, Rol, Region, Tienda } from '@/types'
import { ROL_IDS } from '@/types'
import {
  createUsuario as createUsuarioApi,
  deleteUsuario as deleteUsuarioApi,
  listUsuariosCatalog,
  updateUsuario as updateUsuarioApi,
} from '@/lib/api/usuarios'

export function buildPerfilPayload(values: PerfilFormValues): {
  email: string
  nombre_completo: string | null
  id_rol: number
  id_tienda: number | null
  id_region: number | null
  password?: string
} {
  const nombre = values.nombre_completo.trim() || null
  const base = {
    email: values.email.trim(),
    nombre_completo: nombre,
    id_rol: values.id_rol,
    id_tienda: null as number | null,
    id_region: null as number | null,
  }

  if (values.id_rol === ROL_IDS.Tienda) {
    base.id_tienda = values.id_tienda
  } else if (values.id_rol === ROL_IDS.Regional) {
    base.id_region = values.id_region
  }

  const payload: ReturnType<typeof buildPerfilPayload> = { ...base }
  if (values.password?.trim()) {
    payload.password = values.password.trim()
  }
  return payload
}

export type TiendaFormOption = Pick<Tienda, 'id' | 'sucursal' | 'id_region'>

export function validatePerfilForm(
  values: PerfilFormValues,
  isEdit: boolean,
  tiendas?: TiendaFormOption[],
): string | null {
  if (!values.email.trim()) return 'El correo es obligatorio.'
  if (!values.id_rol) return 'Selecciona un rol.'

  if (!isEdit && !values.password?.trim()) {
    return 'La contraseña es obligatoria al crear un usuario.'
  }

  if (values.id_rol === ROL_IDS.Tienda) {
    if (!values.id_region) {
      return 'Selecciona una región para elegir la tienda.'
    }
    if (!values.id_tienda) {
      return 'Selecciona una tienda para el rol Tienda.'
    }
    if (tiendas?.length) {
      const tienda = tiendas.find((t) => t.id === values.id_tienda)
      if (!tienda || tienda.id_region !== values.id_region) {
        return 'La tienda seleccionada no pertenece a la región indicada.'
      }
    }
  }

  if (values.id_rol === ROL_IDS.Regional && !values.id_region) {
    return 'Selecciona una región para el rol Regional.'
  }

  return null
}

interface UseUsuariosReturn {
  usuarios: Perfil[]
  roles: Rol[]
  tiendas: TiendaFormOption[]
  regiones: Pick<Region, 'id' | 'nombre_region'>[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createUsuario: (values: PerfilFormValues) => Promise<{ error: string | null }>
  updateUsuario: (id: number, values: PerfilFormValues) => Promise<{ error: string | null }>
  deleteUsuario: (id: number) => Promise<{ error: string | null }>
}

export function useUsuarios(): UseUsuariosReturn {
  const { isAdmin, perfil } = useAuth()

  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [tiendas, setTiendas] = useState<TiendaFormOption[]>([])
  const [regiones, setRegiones] = useState<Pick<Region, 'id' | 'nombre_region'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!isAdmin) {
      setUsuarios([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const catalog = await listUsuariosCatalog()
      setUsuarios(catalog.usuarios)
      setRoles(catalog.roles)
      setTiendas(catalog.tiendas)
      setRegiones(catalog.regiones)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar usuarios'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createUsuario = useCallback(
    async (values: PerfilFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const validationError = validatePerfilForm(values, false, tiendas)
      if (validationError) return { error: validationError }

      const payload = buildPerfilPayload(values)
      if (!payload.password) {
        return { error: 'La contraseña es obligatoria al crear un usuario.' }
      }

      const result = await createUsuarioApi(payload)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [fetchAll, tiendas, isAdmin],
  )

  const updateUsuario = useCallback(
    async (id: number, values: PerfilFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      if (perfil?.id === id) {
        return { error: 'No puedes modificar tu propia cuenta.' }
      }

      const validationError = validatePerfilForm(values, true, tiendas)
      if (validationError) return { error: validationError }

      const result = await updateUsuarioApi(id, buildPerfilPayload(values))
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [fetchAll, perfil?.id, tiendas, isAdmin],
  )

  const deleteUsuario = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const result = await deleteUsuarioApi(id)
      if (result.error) return result
      await fetchAll()
      return { error: null }
    },
    [fetchAll, isAdmin],
  )

  return {
    usuarios,
    roles,
    tiendas,
    regiones,
    loading,
    error,
    refetch: fetchAll,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  }
}
