import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { SessionActor } from "../session-actor";
import type { ConfiguracionTiendaPermiso } from "@/types";
import { ACTIVE_STATUSES, firstJoin, isExpiredDate } from "./helpers";
import { deleteStorageFile } from "./storage";

const PERMISOS_SELECT = `
  *,
  tienda:id_tienda(id, sucursal, id_region),
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
`;

function transformPermisoRow(item: Record<string, unknown>): ConfiguracionTiendaPermiso {
  return {
    ...item,
    permiso_vigente: firstJoin(item.permiso_vigente as ConfiguracionTiendaPermiso["permiso_vigente"]),
  } as ConfiguracionTiendaPermiso;
}

export async function listPermisos(actor: SessionActor): Promise<ConfiguracionTiendaPermiso[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("configuracion_tienda_permisos")
    .select(PERMISOS_SELECT)
    .order("id_tienda", { ascending: true });

  if (actor.rol === "Tienda" && actor.id_tienda) {
    query = query.eq("id_tienda", actor.id_tienda);
  } else if (actor.rol === "Regional" && actor.id_region) {
    const { data: tiendasRegion } = await supabase
      .from("tiendas")
      .select("id")
      .eq("id_region", actor.id_region);

    if (tiendasRegion && tiendasRegion.length > 0) {
      query = query.in(
        "id_tienda",
        tiendasRegion.map((t) => t.id),
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const transformed = (data || []).map((item) =>
    transformPermisoRow(item as Record<string, unknown>),
  );

  if (actor.rol === "Tienda") {
    await expireExpiredRows(transformed);
  }

  return transformed;
}

async function expireExpiredRows(rows: ConfiguracionTiendaPermiso[]): Promise<void> {
  const expired = rows.filter((item) => {
    const vigente = item.permiso_vigente;
    if (!vigente?.fecha_vencimiento) return false;
    if (!ACTIVE_STATUSES.has(vigente.estatus)) return false;
    return isExpiredDate(vigente.fecha_vencimiento);
  });

  for (const item of expired) {
    const path = item.permiso_vigente?.archivo_path;
    if (path) await deleteStorageFile(path);
    await markVigenteVencido(item.id_tienda, item.id_tipo_permiso);
    if (item.permiso_vigente) {
      item.permiso_vigente = {
        ...item.permiso_vigente,
        estatus: "Vencido",
        archivo_path: null,
      };
    }
  }
}

export async function expireExpiredVigentes(idTienda?: number): Promise<{ expired: number }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { expired: 0 };

  let query = supabase
    .from("permisos_vigentes")
    .select("id_tienda, id_tipo_permiso, fecha_vencimiento, estatus, archivo_path")
    .in("estatus", ["Activo", "Aprobado"]);

  if (idTienda) query = query.eq("id_tienda", idTienda);

  const { data, error } = await query;
  if (error || !data) return { expired: 0 };

  const expired = data.filter((row) => isExpiredDate(row.fecha_vencimiento));
  for (const row of expired) {
    if (row.archivo_path) await deleteStorageFile(row.archivo_path);
    await markVigenteVencido(row.id_tienda, row.id_tipo_permiso);
  }
  return { expired: expired.length };
}

export async function markVigenteVencido(
  idTienda: number,
  idTipoPermiso: number,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error } = await supabase
    .from("permisos_vigentes")
    .update({
      estatus: "Vencido",
      archivo_path: null,
      ultima_actualizacion: new Date().toISOString(),
    })
    .eq("id_tienda", idTienda)
    .eq("id_tipo_permiso", idTipoPermiso);

  return { error: error?.message ?? null };
}

export async function updatePermisoComentarios(
  configId: number,
  comentarios: string | null,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error } = await supabase
    .from("configuracion_tienda_permisos")
    .update({ comentarios })
    .eq("id", configId);

  return { error: error?.message ?? null };
}

export async function updatePermisoVigencia(
  idTienda: number,
  idTipoPermiso: number,
  fechaVencimiento: string | null,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error } = await supabase
    .from("permisos_vigentes")
    .update({
      fecha_vencimiento: fechaVencimiento,
      ultima_actualizacion: new Date().toISOString(),
    })
    .eq("id_tienda", idTienda)
    .eq("id_tipo_permiso", idTipoPermiso);

  return { error: error?.message ?? null };
}

export type VigentePayload = {
  id_tienda: number;
  id_tipo_permiso: number;
  fecha_vencimiento?: string | null;
  estatus?: string;
  archivo_path?: string | null;
  puntaje?: number | null;
  ultima_actualizacion?: string;
};

export async function upsertPermisoVigente(
  payload: VigentePayload,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: existing, error: findErr } = await supabase
    .from("permisos_vigentes")
    .select("id")
    .eq("id_tienda", payload.id_tienda)
    .eq("id_tipo_permiso", payload.id_tipo_permiso)
    .order("id", { ascending: false });

  if (findErr) return { error: findErr.message };

  const row = {
    ...payload,
    ultima_actualizacion: payload.ultima_actualizacion ?? new Date().toISOString(),
  };

  if ((existing || []).length > 0) {
    const { error } = await supabase
      .from("permisos_vigentes")
      .update(row)
      .eq("id_tienda", payload.id_tienda)
      .eq("id_tipo_permiso", payload.id_tipo_permiso);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("permisos_vigentes").insert(row);
  return { error: error?.message ?? null };
}

export async function deletePermisoVigente(
  idTienda: number,
  idTipoPermiso: number,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: existing } = await supabase
    .from("permisos_vigentes")
    .select("archivo_path")
    .eq("id_tienda", idTienda)
    .eq("id_tipo_permiso", idTipoPermiso);

  for (const row of existing || []) {
    if (row.archivo_path) await deleteStorageFile(row.archivo_path);
  }

  const { error } = await supabase
    .from("permisos_vigentes")
    .delete()
    .eq("id_tienda", idTienda)
    .eq("id_tipo_permiso", idTipoPermiso);

  return { error: error?.message ?? null };
}
