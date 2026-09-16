'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updatePermisoComentarios } from '@/lib/api/permisos'

export const MAX_PERMISO_COMENTARIOS_LENGTH = 2000

export function normalizePermisoComentarios(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

export function validatePermisoComentarios(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length > MAX_PERMISO_COMENTARIOS_LENGTH) {
    return `Las notas no pueden superar ${MAX_PERMISO_COMENTARIOS_LENGTH} caracteres.`
  }
  return null
}

export function usePermisoComentarios() {
  const { isAdmin } = useAuth()

  const updateComentarios = useCallback(
    async (configId: number, comentarios: string | null): Promise<{ error: string | null }> => {
      if (!isAdmin) {
        return { error: 'Solo un administrador puede editar las notas del permiso.' }
      }

      const normalized =
        comentarios === null ? null : normalizePermisoComentarios(comentarios)

      if (comentarios !== null && comentarios !== undefined) {
        const validationError = validatePermisoComentarios(comentarios)
        if (validationError) return { error: validationError }
      }

      return updatePermisoComentarios(configId, normalized)
    },
    [isAdmin],
  )

  return { updateComentarios }
}
