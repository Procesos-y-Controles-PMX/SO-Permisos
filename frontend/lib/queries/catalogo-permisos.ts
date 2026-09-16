import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { CatalogoPermiso } from "@/types";
import type { PermisoAdminRow, PermisoFormPayload } from "./catalogo-permisos.shared";

export type { PermisoAdminRow, PermisoFormPayload } from "./catalogo-permisos.shared";

const PERMISO_SEQUENCE_ERROR =
  "No se pudo crear el permiso por un conflicto de ID en la base de datos. Contacta al administrador para sincronizar la secuencia de catalogo_permisos (ver db/fix-sequences.sql).";

function mapPermisoInsertError(err: { code?: string; message: string }): string {
  if (err.code === "23505" && err.message.includes("catalogo_permisos_pkey")) {
    return PERMISO_SEQUENCE_ERROR;
  }
  return err.message;
}

async function checkDuplicatePermisoName(
  nombre: string,
  excludeId?: number,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return "Servidor sin configuración de base de datos.";

  const { data, error } = await supabase
    .from("catalogo_permisos")
    .select("id, nombre_permiso")
    .ilike("nombre_permiso", nombre.trim());

  if (error) return error.message;

  const duplicate = (data || []).find(
    (p) =>
      p.nombre_permiso.trim().toLowerCase() === nombre.trim().toLowerCase() &&
      p.id !== excludeId,
  );

  if (duplicate) return "Ya existe un permiso con ese nombre.";
  return null;
}

export async function listCatalogoPermisosAdmin(): Promise<PermisoAdminRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const [catalogoRes, configRes, vigentesRes, solicitudesRes] = await Promise.all([
    supabase.from("catalogo_permisos").select("id, nombre_permiso, ponderacion").order("nombre_permiso"),
    supabase.from("configuracion_tienda_permisos").select("id_tipo_permiso, id_tienda"),
    supabase.from("permisos_vigentes").select("id_tipo_permiso"),
    supabase.from("solicitudes").select("id_tipo_permiso"),
  ]);

  if (catalogoRes.error) throw new Error(catalogoRes.error.message);
  if (configRes.error) throw new Error(configRes.error.message);
  if (vigentesRes.error) throw new Error(vigentesRes.error.message);
  if (solicitudesRes.error) throw new Error(solicitudesRes.error.message);

  const tiendasByPermiso = new Map<number, Set<number>>();
  (configRes.data || []).forEach((row) => {
    const idTipo = row.id_tipo_permiso as number;
    const idTienda = row.id_tienda as number;
    if (!tiendasByPermiso.has(idTipo)) tiendasByPermiso.set(idTipo, new Set());
    tiendasByPermiso.get(idTipo)!.add(idTienda);
  });

  const vigentesByPermiso = new Map<number, number>();
  (vigentesRes.data || []).forEach((row) => {
    const idTipo = row.id_tipo_permiso as number;
    vigentesByPermiso.set(idTipo, (vigentesByPermiso.get(idTipo) || 0) + 1);
  });

  const solicitudesByPermiso = new Map<number, number>();
  (solicitudesRes.data || []).forEach((row) => {
    const idTipo = row.id_tipo_permiso as number;
    solicitudesByPermiso.set(idTipo, (solicitudesByPermiso.get(idTipo) || 0) + 1);
  });

  return (catalogoRes.data || []).map((p) => ({
    ...(p as CatalogoPermiso),
    tiendaCount: tiendasByPermiso.get((p as CatalogoPermiso).id)?.size || 0,
    vigenteCount: vigentesByPermiso.get((p as CatalogoPermiso).id) || 0,
    solicitudCount: solicitudesByPermiso.get((p as CatalogoPermiso).id) || 0,
  }));
}

export async function createCatalogoPermiso(
  payload: PermisoFormPayload,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const duplicateError = await checkDuplicatePermisoName(payload.nombre_permiso);
  if (duplicateError) return { error: duplicateError };

  const { error } = await supabase.from("catalogo_permisos").insert(payload);
  return { error: error ? mapPermisoInsertError(error) : null };
}

export async function updateCatalogoPermiso(
  id: number,
  payload: PermisoFormPayload,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const duplicateError = await checkDuplicatePermisoName(payload.nombre_permiso, id);
  if (duplicateError) return { error: duplicateError };

  const { error } = await supabase.from("catalogo_permisos").update(payload).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteCatalogoPermiso(id: number): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error: solicitudesErr } = await supabase.from("solicitudes").delete().eq("id_tipo_permiso", id);
  if (solicitudesErr) return { error: solicitudesErr.message };

  const { error: vigentesErr } = await supabase.from("permisos_vigentes").delete().eq("id_tipo_permiso", id);
  if (vigentesErr) return { error: vigentesErr.message };

  const { error: configErr } = await supabase
    .from("configuracion_tienda_permisos")
    .delete()
    .eq("id_tipo_permiso", id);
  if (configErr) return { error: configErr.message };

  const { error: delErr } = await supabase.from("catalogo_permisos").delete().eq("id", id);
  if (delErr) {
    if (delErr.code === "23503") {
      return {
        error:
          "No se puede eliminar el permiso porque tiene datos relacionados. Revisa referencias pendientes.",
      };
    }
    return { error: delErr.message };
  }

  return { error: null };
}
