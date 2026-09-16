import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { DescargasOptions } from "./descargas.shared";

export type { DescargasOptions } from "./descargas.shared";

export async function listDescargasOptions(): Promise<DescargasOptions> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { regions: [], stores: [], permisosCatalogo: [] };

  const [regionsRes, storesRes, permisosRes] = await Promise.all([
    supabase.from("regiones").select("id, nombre_region").order("nombre_region"),
    supabase.from("tiendas").select("id, sucursal, id_region").order("sucursal"),
    supabase.from("catalogo_permisos").select("id, nombre_permiso").order("nombre_permiso"),
  ]);

  if (regionsRes.error) throw new Error(regionsRes.error.message);
  if (storesRes.error) throw new Error(storesRes.error.message);
  if (permisosRes.error) throw new Error(permisosRes.error.message);

  return {
    regions: (regionsRes.data || []) as DescargasOptions["regions"],
    stores: (storesRes.data || []) as DescargasOptions["stores"],
    permisosCatalogo: (permisosRes.data || []) as DescargasOptions["permisosCatalogo"],
  };
}
