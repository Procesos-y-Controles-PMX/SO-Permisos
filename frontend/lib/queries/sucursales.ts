import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { CatalogoPermiso, Region, Tienda } from "@/types";
import type {
  RegionAdminRow,
  RegionWritePayload,
  SucursalesCatalog,
  TiendaAdminRow,
  TiendaWritePayload,
} from "./sucursales.shared";

export type {
  RegionAdminRow,
  RegionWritePayload,
  SucursalesCatalog,
  TiendaAdminRow,
  TiendaWritePayload,
} from "./sucursales.shared";

const REGION_SEQUENCE_ERROR =
  "No se pudo crear la región por un conflicto de ID en la base de datos. Contacta al administrador para sincronizar la secuencia de regiones (ver db/fix-sequences.sql).";

function mapRegionInsertError(err: { code?: string; message: string }): string {
  if (err.code === "23505" && err.message.includes("regiones_pkey")) {
    return REGION_SEQUENCE_ERROR;
  }
  return err.message;
}

async function checkDuplicateRegionName(nombre: string, excludeId?: number): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return "Servidor sin configuración de base de datos.";

  const { data, error } = await supabase
    .from("regiones")
    .select("id, nombre_region")
    .ilike("nombre_region", nombre.trim());

  if (error) return error.message;

  const duplicate = (data || []).find(
    (r) => r.nombre_region.trim().toLowerCase() === nombre.trim().toLowerCase() && r.id !== excludeId,
  );
  if (duplicate) return "Ya existe una región con ese nombre.";
  return null;
}

async function syncPermisosConfig(
  idTienda: number,
  selectedIds: number[],
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: current, error: fetchErr } = await supabase
    .from("configuracion_tienda_permisos")
    .select("id_tipo_permiso")
    .eq("id_tienda", idTienda);

  if (fetchErr) return { error: fetchErr.message };

  const currentIds = new Set((current || []).map((r) => r.id_tipo_permiso as number));
  const selectedSet = new Set(selectedIds);
  const toRemove = [...currentIds].filter((id) => !selectedSet.has(id));
  const toAdd = selectedIds.filter((id) => !currentIds.has(id));

  for (const idTipo of toRemove) {
    const { error } = await supabase
      .from("configuracion_tienda_permisos")
      .delete()
      .eq("id_tienda", idTienda)
      .eq("id_tipo_permiso", idTipo);
    if (error) return { error: error.message };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("configuracion_tienda_permisos").insert(
      toAdd.map((id_tipo_permiso) => ({
        id_tienda: idTienda,
        id_tipo_permiso,
        obligatorio: true,
      })),
    );
    if (error) return { error: error.message };
  }

  return { error: null };
}

export async function listSucursalesCatalog(): Promise<SucursalesCatalog> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { tiendas: [], regiones: [], catalogo: [] };

  const [tiendasRes, regionesRes, catalogoRes, configRes, perfilesRes] = await Promise.all([
    supabase.from("tiendas").select("*, region:id_region(id, nombre_region)").order("sucursal"),
    supabase
      .from("regiones")
      .select("id, nombre_region, gerente_regional, celular, correo")
      .order("nombre_region"),
    supabase.from("catalogo_permisos").select("id, nombre_permiso, ponderacion").order("nombre_permiso"),
    supabase.from("configuracion_tienda_permisos").select("id_tienda"),
    supabase.from("perfiles").select("id_region"),
  ]);

  if (tiendasRes.error) throw new Error(tiendasRes.error.message);
  if (regionesRes.error) throw new Error(regionesRes.error.message);
  if (catalogoRes.error) throw new Error(catalogoRes.error.message);
  if (configRes.error) throw new Error(configRes.error.message);
  if (perfilesRes.error) throw new Error(perfilesRes.error.message);

  const countByTienda = new Map<number, number>();
  (configRes.data || []).forEach((row) => {
    const tid = row.id_tienda as number;
    countByTienda.set(tid, (countByTienda.get(tid) || 0) + 1);
  });

  const rows: TiendaAdminRow[] = (tiendasRes.data || []).map((t) => ({
    ...(t as Tienda),
    permisoCount: countByTienda.get((t as Tienda).id) || 0,
  }));

  const countByRegion = new Map<number, number>();
  rows.forEach((t) => {
    const rid = t.id_region ?? t.region?.id;
    if (rid) countByRegion.set(rid, (countByRegion.get(rid) || 0) + 1);
  });

  const countUsersByRegion = new Map<number, number>();
  (perfilesRes.data || []).forEach((p) => {
    const rid = p.id_region as number | null;
    if (rid) countUsersByRegion.set(rid, (countUsersByRegion.get(rid) || 0) + 1);
  });

  const regionRows: RegionAdminRow[] = (regionesRes.data || []).map((r) => ({
    ...(r as RegionAdminRow),
    tiendaCount: countByRegion.get((r as RegionAdminRow).id) || 0,
    usuarioCount: countUsersByRegion.get((r as RegionAdminRow).id) || 0,
  }));

  return {
    tiendas: rows,
    regiones: regionRows,
    catalogo: (catalogoRes.data || []) as CatalogoPermiso[],
  };
}

export async function getPermisosAsignados(idTienda: number): Promise<number[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("configuracion_tienda_permisos")
    .select("id_tipo_permiso")
    .eq("id_tienda", idTienda);

  if (error) return [];
  return (data || []).map((r) => r.id_tipo_permiso as number);
}

export async function createRegion(payload: RegionWritePayload): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const duplicateError = await checkDuplicateRegionName(payload.nombre_region);
  if (duplicateError) return { error: duplicateError };

  const { error } = await supabase.from("regiones").insert(payload);
  return { error: error ? mapRegionInsertError(error) : null };
}

export async function updateRegion(
  id: number,
  payload: RegionWritePayload,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const duplicateError = await checkDuplicateRegionName(payload.nombre_region, id);
  if (duplicateError) return { error: duplicateError };

  const { error } = await supabase.from("regiones").update(payload).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteRegion(id: number): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: tiendasLinked, error: tiendasErr } = await supabase
    .from("tiendas")
    .select("id")
    .eq("id_region", id);
  if (tiendasErr) return { error: tiendasErr.message };

  const tiendaCount = (tiendasLinked || []).length;
  if (tiendaCount > 0) {
    return {
      error: `No se puede eliminar: hay ${tiendaCount} sucursal${tiendaCount !== 1 ? "es" : ""} en esta región. Reasígnalas o elimínalas primero.`,
    };
  }

  const { data: users, error: usersErr } = await supabase.from("perfiles").select("id").eq("id_region", id);
  if (usersErr) return { error: usersErr.message };

  const usuarioCount = (users || []).length;
  if (usuarioCount > 0) {
    return {
      error: `No se puede eliminar: hay ${usuarioCount} usuario${usuarioCount !== 1 ? "s" : ""} Regional asignado${usuarioCount !== 1 ? "s" : ""}. Reasígnalos en Usuarios primero.`,
    };
  }

  const { error: delErr } = await supabase.from("regiones").delete().eq("id", id);
  if (delErr) {
    if (delErr.code === "23503") {
      return {
        error:
          "No se puede eliminar la región porque tiene datos relacionados. Revisa sucursales o usuarios vinculados.",
      };
    }
    return { error: delErr.message };
  }
  return { error: null };
}

export async function createTienda(
  payload: TiendaWritePayload,
  permisosSeleccionados: number[],
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: inserted, error: insertErr } = await supabase
    .from("tiendas")
    .insert(payload)
    .select("id")
    .single();

  if (insertErr) return { error: insertErr.message };
  if (!inserted?.id) return { error: "No se pudo crear la sucursal." };

  const syncResult = await syncPermisosConfig(inserted.id as number, permisosSeleccionados);
  if (syncResult.error) {
    await supabase.from("tiendas").delete().eq("id", inserted.id);
    return { error: syncResult.error };
  }

  return { error: null };
}

export async function updateTienda(
  id: number,
  payload: TiendaWritePayload,
  permisosSeleccionados: number[],
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error: updateErr } = await supabase.from("tiendas").update(payload).eq("id", id);
  if (updateErr) return { error: updateErr.message };

  return syncPermisosConfig(id, permisosSeleccionados);
}

export async function deleteTienda(id: number): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: users, error: usersErr } = await supabase.from("perfiles").select("id").eq("id_tienda", id);
  if (usersErr) return { error: usersErr.message };

  if ((users || []).length > 0) {
    const n = users!.length;
    return {
      error: `No se puede eliminar: hay ${n} usuario${n !== 1 ? "s" : ""} asignado${n !== 1 ? "s" : ""} a esta sucursal. Reasígnalos o elimínalos primero.`,
    };
  }

  const { error: delErr } = await supabase.from("tiendas").delete().eq("id", id);
  if (delErr) {
    if (delErr.code === "23503") {
      return {
        error:
          "No se puede eliminar la sucursal porque tiene datos relacionados. Revisa usuarios u otras referencias.",
      };
    }
    return { error: delErr.message };
  }
  return { error: null };
}
