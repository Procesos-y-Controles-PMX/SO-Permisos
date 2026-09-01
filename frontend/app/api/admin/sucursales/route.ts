import { NextResponse } from 'next/server'
import { adminDbError, adminDbUnavailable, getAdminSupabase } from '@/lib/admin/server'
import type { CatalogoPermiso, Tienda } from '@/types'
import type { RegionAdminRow, TiendaAdminRow } from '@/hooks/useSucursalesAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getAdminSupabase()
  if (!supabase) return adminDbUnavailable()

  try {
    const [tiendasRes, regionesRes, catalogoRes, configRes, perfilesRes] = await Promise.all([
      supabase
        .from('tiendas')
        .select('*, region:id_region(id, nombre_region)')
        .order('sucursal'),
      supabase
        .from('regiones')
        .select('id, nombre_region, gerente_regional, celular, correo')
        .order('nombre_region'),
      supabase.from('catalogo_permisos').select('id, nombre_permiso, ponderacion').order('nombre_permiso'),
      supabase.from('configuracion_tienda_permisos').select('id_tienda'),
      supabase.from('perfiles').select('id_region'),
    ])

    if (tiendasRes.error) throw tiendasRes.error
    if (regionesRes.error) throw regionesRes.error
    if (catalogoRes.error) throw catalogoRes.error
    if (configRes.error) throw configRes.error
    if (perfilesRes.error) throw perfilesRes.error

    const countByTienda = new Map<number, number>()
    ;(configRes.data || []).forEach((row) => {
      const tid = row.id_tienda as number
      countByTienda.set(tid, (countByTienda.get(tid) || 0) + 1)
    })

    const tiendas: TiendaAdminRow[] = (tiendasRes.data || []).map((t) => ({
      ...(t as Tienda),
      permisoCount: countByTienda.get((t as Tienda).id) || 0,
    }))

    const countByRegion = new Map<number, number>()
    tiendas.forEach((t) => {
      const rid = t.id_region ?? t.region?.id
      if (rid) countByRegion.set(rid, (countByRegion.get(rid) || 0) + 1)
    })

    const countUsersByRegion = new Map<number, number>()
    ;(perfilesRes.data || []).forEach((p) => {
      const rid = p.id_region as number | null
      if (rid) countUsersByRegion.set(rid, (countUsersByRegion.get(rid) || 0) + 1)
    })

    const regiones: RegionAdminRow[] = (regionesRes.data || []).map((r) => ({
      ...(r as RegionAdminRow),
      tiendaCount: countByRegion.get((r as RegionAdminRow).id) || 0,
      usuarioCount: countUsersByRegion.get((r as RegionAdminRow).id) || 0,
    }))

    return NextResponse.json({
      ok: true,
      tiendas,
      regiones,
      catalogo: (catalogoRes.data || []) as CatalogoPermiso[],
    })
  } catch (error) {
    return adminDbError(error, 'Error al cargar sucursales')
  }
}
