'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Perfil, RolUsuario } from '@/types'

// ── Storage key ────────────────────────────────────────────
const STORAGE_KEY = 'permisos_user'

// ── Context Shape ──────────────────────────────────────────

interface AuthState {
  perfil: Perfil | null
  rol: RolUsuario | null
  loading: boolean
  // Role helpers
  isAdmin: boolean
  isTienda: boolean
  isRegional: boolean
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// ── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [rol, setRol] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(true)

  // ─ Load from localStorage on mount ─
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { perfil: Perfil; rol: RolUsuario }
        setPerfil(parsed.perfil)
        setRol(parsed.rol)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  // ─ Persist to localStorage whenever perfil changes ─
  useEffect(() => {
    if (perfil && rol) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ perfil, rol }))
    }
  }, [perfil, rol])

  // ─ Fetch perfil from DB by ID ─
  const fetchPerfil = useCallback(async (userId: number) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, email, nombre_completo, id_rol, id_tienda, id_region, created_at, roles:id_rol(id, nombre_rol)')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('Error fetching perfil:', error?.message)
      return
    }

    const rolData = (data.roles as unknown) as { id: number; nombre_rol: RolUsuario } | null
    const perfilData: Perfil = {
      id: data.id,
      email: data.email,
      nombre_completo: data.nombre_completo,
      id_rol: data.id_rol,
      id_tienda: data.id_tienda,
      id_region: data.id_region,
      created_at: data.created_at,
    }

    setPerfil(perfilData)
    setRol(rolData?.nombre_rol ?? null)
  }, [supabase])

  // ─ Sign In (custom: SELECT from perfiles by email+password) ─
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, email, nombre_completo, id_rol, id_tienda, id_region, created_at, roles:id_rol(id, nombre_rol)')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      return { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }
    }

    const rolData = (data.roles as unknown) as { id: number; nombre_rol: RolUsuario } | null
    const perfilData: Perfil = {
      id: data.id,
      email: data.email,
      nombre_completo: data.nombre_completo,
      id_rol: data.id_rol,
      id_tienda: data.id_tienda,
      id_region: data.id_region,
      created_at: data.created_at,
    }

    setPerfil(perfilData)
    setRol(rolData?.nombre_rol ?? null)

    return { error: null }
  }

  // ─ Sign Out (clear state + localStorage) ─
  const signOut = () => {
    setPerfil(null)
    setRol(null)
    localStorage.removeItem(STORAGE_KEY)
    router.push('/login')
  }

  // ─ Refresh perfil from DB ─
  const refreshPerfil = async () => {
    if (perfil) {
      await fetchPerfil(perfil.id)
    }
  }

  // ─ Role helpers ─
  const isAdmin = rol === 'Admin'
  const isTienda = rol === 'Tienda'
  const isRegional = rol === 'Regional'

  return (
    <AuthContext.Provider
      value={{
        perfil,
        rol,
        loading,
        isAdmin,
        isTienda,
        isRegional,
        signIn,
        signOut,
        refreshPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
