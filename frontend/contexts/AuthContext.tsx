'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
import type { Perfil, RolUsuario } from '@/types'

// ── Context Shape ──────────────────────────────────────────

interface AuthState {
  user: User | null
  session: Session | null
  perfil: Perfil | null
  rol: RolUsuario | null
  loading: boolean
  // Role helpers
  isAdmin: boolean
  isTienda: boolean
  isRegional: boolean
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// ── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [rol, setRol] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(true)

  // ─ Fetch perfil from DB ─
  const fetchPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, roles:id_rol(id, nombre_rol)')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('Error fetching perfil:', error?.message)
      setPerfil(null)
      setRol(null)
      return
    }

    // Map the joined roles object
    const rolData = data.roles as { id: number; nombre_rol: RolUsuario } | null
    const perfilData: Perfil = {
      id: data.id,
      username: data.username,
      nombre_completo: data.nombre_completo,
      id_rol: data.id_rol,
      id_tienda: data.id_tienda,
      id_region: data.id_region,
      updated_at: data.updated_at,
    }

    setPerfil(perfilData)
    setRol(rolData?.nombre_rol ?? null)
  }, [supabase])

  // ─ Initialize session ─
  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await fetchPerfil(currentSession.user.id)
      }
      setLoading(false)
    }

    initSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchPerfil(newSession.user.id)
        }

        if (event === 'SIGNED_OUT') {
          setPerfil(null)
          setRol(null)
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchPerfil, router])

  // ─ Sign In ─
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }

  // ─ Sign Out ─
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ─ Refresh perfil ─
  const refreshPerfil = async () => {
    if (user) {
      await fetchPerfil(user.id)
    }
  }

  // ─ Role helpers ─
  const isAdmin = rol === 'Admin'
  const isTienda = rol === 'Tienda'
  const isRegional = rol === 'Regional'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
