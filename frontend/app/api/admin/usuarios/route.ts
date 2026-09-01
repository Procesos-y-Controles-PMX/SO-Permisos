import { NextResponse } from 'next/server'
import { mapPerfilRow, PERFIL_SELECT } from '@/lib/admin/perfiles'
import { adminDbError, adminDbUnavailable, getAdminSupabase } from '@/lib/admin/server'
import type { Rol, Region } from '@/types'
import type { TiendaFormOption } from '@/hooks/useUsuarios'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getAdminSupabase()
  if (!supabase) return adminDbUnavailable()

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

    return NextResponse.json({
      ok: true,
      usuarios: (perfilesRes.data || []).map((row) => mapPerfilRow(row as Record<string, unknown>)),
      roles: (rolesRes.data || []) as Rol[],
      tiendas: (tiendasRes.data || []) as TiendaFormOption[],
      regiones: (regionesRes.data || []) as Pick<Region, 'id' | 'nombre_region'>[],
    })
  } catch (error) {
    return adminDbError(error, 'Error al cargar usuarios')
  }
}
