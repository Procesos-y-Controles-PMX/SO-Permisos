'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatErrorMessage } from '@/lib/format-error'
import type { Perfil, PerfilFormValues, Rol, Region, Tienda } from '@/types'
import { ROL_IDS } from '@/types'

export type TiendaFormOption = Pick<Tienda, 'id' | 'sucursal' | 'id_region'>

interface UsuariosApiResponse {
  ok: boolean
  message?: string
  usuarios?: Perfil[]
  roles?: Rol[]
  tiendas?: TiendaFormOption[]
  regiones?: Pick<Region, 'id' | 'nombre_region'>[]
}

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
  const supabase = useMemo(() => createClient(), [])
  const { isAdmin, loading: authLoading, perfil } = useAuth()

  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [tiendas, setTiendas] = useState<TiendaFormOption[]>([])
  const [regiones, setRegiones] = useState<Pick<Region, 'id' | 'nombre_region'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (authLoading) return

    if (!isAdmin) {
      setUsuarios([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/usuarios', { cache: 'no-store' })
      const payload = (await response.json()) as UsuariosApiResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Error al cargar usuarios')
      }

      setUsuarios(payload.usuarios || [])
      setRoles(payload.roles || [])
      setTiendas(payload.tiendas || [])
      setRegiones(payload.regiones || [])
    } catch (e: unknown) {
      setError(formatErrorMessage(e, 'Error al cargar usuarios'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, authLoading])

  useEffect(() => {
    fetchAll()
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

      const { error: err } = await supabase.from('perfiles').insert({
        email: payload.email,
        password: payload.password,
        nombre_completo: payload.nombre_completo,
        id_rol: payload.id_rol,
        id_tienda: payload.id_tienda,
        id_region: payload.id_region,
      })

      if (err) {
        if (err.code === '23505') return { error: 'Ya existe un usuario con ese correo.' }
        return { error: err.message }
      }

      await fetchAll()
      return { error: null }
    },
    [supabase, fetchAll, tiendas, isAdmin],
  )

  const updateUsuario = useCallback(
    async (id: number, values: PerfilFormValues) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      if (perfil?.id === id) {
        return { error: 'No puedes modificar tu propia cuenta.' }
      }

      const validationError = validatePerfilForm(values, true, tiendas)
      if (validationError) return { error: validationError }

      const payload = buildPerfilPayload(values)
      const updateBody: Record<string, unknown> = {
        email: payload.email,
        nombre_completo: payload.nombre_completo,
        id_rol: payload.id_rol,
        id_tienda: payload.id_tienda,
        id_region: payload.id_region,
      }
      if (payload.password) {
        updateBody.password = payload.password
      }

      const { error: err } = await supabase.from('perfiles').update(updateBody).eq('id', id)

      if (err) {
        if (err.code === '23505') return { error: 'Ya existe un usuario con ese correo.' }
        return { error: err.message }
      }

      await fetchAll()
      return { error: null }
    },
    [supabase, fetchAll, perfil?.id, tiendas, isAdmin],
  )

  const deleteUsuario = useCallback(
    async (id: number) => {
      if (!isAdmin) return { error: 'No autorizado.' }
      const { error: clearErr } = await supabase
        .from('solicitudes')
        .update({ id_admin_revisor: null })
        .eq('id_admin_revisor', id)

      if (clearErr) return { error: clearErr.message }

      const { error: delErr } = await supabase.from('perfiles').delete().eq('id', id)

      if (delErr) return { error: delErr.message }

      await fetchAll()
      return { error: null }
    },
    [supabase, fetchAll, isAdmin],
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
