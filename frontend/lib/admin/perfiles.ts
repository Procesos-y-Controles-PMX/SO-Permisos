import type { Perfil, Region, RolUsuario, Tienda } from '@/types'

export const PERFIL_SELECT = `
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

export function mapPerfilRow(row: Record<string, unknown>): Perfil {
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
