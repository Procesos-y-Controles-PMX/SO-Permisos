'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { resolveVigenciaParaGuardar } from '@/lib/vigencia'
import { updatePermisoVigencia } from '@/lib/api/permisos'
import type { ConfiguracionTiendaPermiso } from '@/types'

export function usePermisoVigencia() {
  const { isAdmin } = useAuth()

  const updateVigencia = useCallback(
    async (
      config: ConfiguracionTiendaPermiso,
      vigencia: string,
      sinVencimiento: boolean,
    ): Promise<{ error: string | null }> => {
      if (!isAdmin) {
        return { error: 'Solo un administrador puede editar la vigencia del permiso.' }
      }

      if (!config.permiso_vigente) {
        return { error: 'No hay un permiso vigente para actualizar.' }
      }

      const { value: vigenciaGuardar, error: vigenciaError } = resolveVigenciaParaGuardar(
        vigencia,
        sinVencimiento,
      )
      if (vigenciaError) return { error: vigenciaError }

      return updatePermisoVigencia(config.id_tienda, config.id_tipo_permiso, vigenciaGuardar)
    },
    [isAdmin],
  )

  return { updateVigencia }
}
