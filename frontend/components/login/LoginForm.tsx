'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        // Translate common Supabase errors to Spanish
        if (signInError.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
        } else if (signInError.includes('Email not confirmed')) {
          setError('Tu correo no ha sido confirmado.')
        } else {
          setError(signInError)
        }
        return
      }
      // Success — redirect to dashboard
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Iniciar sesión
        </h2>
        <p className="text-gray-500 text-sm">
          Ingresa tus credenciales para acceder al sistema.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
        >
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          placeholder="usuario@cemex.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500
            transition-all duration-200"
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500
              transition-all duration-200 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-lg
          transition-all duration-200 shadow-lg shadow-red-600/25 hover:shadow-red-600/40
          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-red-600
          flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Accediendo...
          </>
        ) : (
          'Acceder'
        )}
      </button>

      {/* Footer text */}
      <div className="pt-4 text-center space-y-1">
        <p className="text-xs text-gray-400">
          Acceso restringido a personal autorizado.
        </p>
        <p className="text-xs text-gray-500 font-medium">
          Promexma / CEMEX
        </p>
      </div>
    </form>
  )
}
