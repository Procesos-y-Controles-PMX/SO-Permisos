'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Perfil, PerfilFormValues, Rol, Region, Tienda, RolUsuario } from '@/types'
import { ROL_IDS } from '@/types'

const PERFIL_SELECT = `
  id,
  email,
  nombre_completo,
  id_rol,
  id_tienda,
  id_region,
  created_at,
  roles:id_rol(id, nombre_rol),
  tienda:id_tienda(id, sucursal, region:id_region(id, nombre_region)),
  region:id_region(id, nombre_region)
`

function mapPerfilRow(row: Record<string, unknown>): Perfil {
  const rolData = row.roles as { id: number; nombre_rol: RolUsuario } | null
  const tiendaData = row.tienda as {
    id: number
    sucursal: string
    region?: { id: number; nombre_region: string } | null
  } | null
  const regionData = row.region as { id: number; nombre_region: string } | null

  return {
    id: row.id as number,
    email: row.email as string,
    nombre_completo: row.nombre_completo as string | null,
    id_rol: row.id_rol as number,
    id_tienda: row.id_tienda as number | null,
    id_region: row.id_region as number | null,
    created_at: row.created_at as string,
    rol: rolData ? { id: rolData.id, nombre_rol: rolData.nombre_rol } : undefined,
    tienda: tiendaData
      ? ({
          id: tiendaData.id,
          sucursal: tiendaData.sucursal,
          id_region: tiendaData.region?.id ?? 0,
          region: tiendaData.region
            ? ({
                id: tiendaData.region.id,
                nombre_region: tiendaData.region.nombre_region,
              } as Region)
            : undefined,
        } as Tienda)
      : undefined,
    region: regionData
      ? ({ id: regionData.id, nombre_region: regionData.nombre_region } as Region)
      : undefined,
  }
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
  const supabase = useMemo(() => createClient(), [])
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
      const [perfilesRes, rolesRes, tiendasRes, regionesRes] = await Promise.all([
        supabase.from('perfiles').select(PERFIL_SELECT),
        supabase.from('roles').select('id, nombre_rol').order('id'),
        supabase.from('tiendas').select('id, sucursal, id_region').order('sucursal'),
        supabase.from('regiones').select('id, nombre_region').order('nombre_region'),
      ])

      if (perfilesRes.error) throw perfilesRes.error
      if (rolesRes.error) throw rolesRes.error
      if (tiendasRes.error) throw tiendasRes.error
      if (regionesRes.error) throw regionesRes.error

      setUsuarios((perfilesRes.data || []).map((row) => mapPerfilRow(row as Record<string, unknown>)))
      setRoles((rolesRes.data || []) as Rol[])
      setTiendas((tiendasRes.data || []) as TiendaFormOption[])
      setRegiones((regionesRes.data || []) as Pick<Region, 'id' | 'nombre_region'>[])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar usuarios'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase, isAdmin])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createUsuario = useCallback(
    async (values: PerfilFormValues) => {
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
    [supabase, fetchAll, tiendas],
  )

  const updateUsuario = useCallback(
    async (id: number, values: PerfilFormValues) => {
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
    [supabase, fetchAll, perfil?.id, tiendas],
  )

  const deleteUsuario = useCallback(
    async (id: number) => {
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
    [supabase, fetchAll],
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
