'use client'

import { useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { resolveVigenciaParaGuardar } from '@/lib/vigencia'
import type { ConfiguracionTiendaPermiso } from '@/types'

export function usePermisoVigencia() {
  const supabase = useMemo(() => createClient(), [])
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

      const { error } = await supabase
        .from('permisos_vigentes')
        .update({
          fecha_vencimiento: vigenciaGuardar,
          ultima_actualizacion: new Date().toISOString(),
        })
        .eq('id_tienda', config.id_tienda)
        .eq('id_tipo_permiso', config.id_tipo_permiso)

      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase, isAdmin],
  )

  return { updateVigencia }
}
