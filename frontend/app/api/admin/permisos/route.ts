import { NextResponse } from 'next/server'
import { adminDbError, adminDbUnavailable, getAdminSupabase } from '@/lib/admin/server'
import type { CatalogoPermiso } from '@/types'
import type { PermisoAdminRow } from '@/hooks/usePermisosAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getAdminSupabase()
  if (!supabase) return adminDbUnavailable()

  try {
    const [catalogoRes, configRes, vigentesRes, solicitudesRes] = await Promise.all([
      supabase
        .from('catalogo_permisos')
        .select('id, nombre_permiso, ponderacion')
        .order('nombre_permiso'),
      supabase.from('configuracion_tienda_permisos').select('id_tipo_permiso, id_tienda'),
      supabase.from('permisos_vigentes').select('id_tipo_permiso'),
      supabase.from('solicitudes').select('id_tipo_permiso'),
    ])

    if (catalogoRes.error) throw catalogoRes.error
    if (configRes.error) throw configRes.error
    if (vigentesRes.error) throw vigentesRes.error
    if (solicitudesRes.error) throw solicitudesRes.error

    const tiendasByPermiso = new Map<number, Set<number>>()
    ;(configRes.data || []).forEach((row) => {
      const idTipo = row.id_tipo_permiso as number
      const idTienda = row.id_tienda as number
      if (!tiendasByPermiso.has(idTipo)) tiendasByPermiso.set(idTipo, new Set())
      tiendasByPermiso.get(idTipo)!.add(idTienda)
    })

    const vigentesByPermiso = new Map<number, number>()
    ;(vigentesRes.data || []).forEach((row) => {
      const idTipo = row.id_tipo_permiso as number
      vigentesByPermiso.set(idTipo, (vigentesByPermiso.get(idTipo) || 0) + 1)
    })

    const solicitudesByPermiso = new Map<number, number>()
    ;(solicitudesRes.data || []).forEach((row) => {
      const idTipo = row.id_tipo_permiso as number
      solicitudesByPermiso.set(idTipo, (solicitudesByPermiso.get(idTipo) || 0) + 1)
    })

    const permisos: PermisoAdminRow[] = (catalogoRes.data || []).map((p) => ({
      ...(p as CatalogoPermiso),
      tiendaCount: tiendasByPermiso.get((p as CatalogoPermiso).id)?.size || 0,
      vigenteCount: vigentesByPermiso.get((p as CatalogoPermiso).id) || 0,
      solicitudCount: solicitudesByPermiso.get((p as CatalogoPermiso).id) || 0,
    }))

    return NextResponse.json({ ok: true, permisos })
  } catch (error) {
    return adminDbError(error, 'Error al cargar permisos')
  }
}
