import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { ConfiguracionTiendaPermiso } from "@/types";
import { firstJoin } from "./helpers";
import { expireExpiredVigentes } from "./permisos";
import type { TiendaDetalle } from "./tienda-detalle.shared";

export type { TiendaDetalle } from "./tienda-detalle.shared";

export async function getTiendaDetalle(idTienda: number): Promise<TiendaDetalle> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { tienda: null, permisos: [], solicitudes: [] };

  await expireExpiredVigentes(idTienda);

  const { data: tiendaData, error: tiendaErr } = await supabase
    .from("tiendas")
    .select("*, region:id_region(id, nombre_region, gerente_regional, celular, correo)")
    .eq("id", idTienda)
    .single();

  if (tiendaErr) throw new Error(tiendaErr.message);

  const { data: permisosData, error: permisosErr } = await supabase
    .from("configuracion_tienda_permisos")
    .select(`
      *,
      tipo_permiso:id_tipo_permiso(id, nombre_permiso, ponderacion),
      permiso_vigente:permisos_vigentes(
        id,
        fecha_vencimiento,
        estatus,
        archivo_path,
        puntaje,
        comentarios,
        ultima_actualizacion
      )
    `)
    .eq("id_tienda", idTienda)
    .order("id", { ascending: true });

  if (permisosErr) throw new Error(permisosErr.message);

  const permisos = (permisosData || []).map((item) => ({
    ...item,
    permiso_vigente: firstJoin(item.permiso_vigente),
  })) as ConfiguracionTiendaPermiso[];

  const { data: solicitudesData, error: solicitudesErr } = await supabase
    .from("solicitudes")
    .select(`
      *,
      tipo_permiso:id_tipo_permiso(id, nombre_permiso)
    `)
    .eq("id_tienda", idTienda)
    .order("fecha_solicitud", { ascending: false });

  if (solicitudesErr) throw new Error(solicitudesErr.message);

  return {
    tienda: tiendaData as Record<string, unknown>,
    permisos,
    solicitudes: solicitudesData || [],
  };
}
