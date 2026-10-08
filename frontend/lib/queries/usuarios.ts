import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { Perfil, Region, Rol, RolUsuario, Tienda } from "@/types";
import type { TiendaFormOption, UsuariosCatalog, UsuarioWritePayload } from "./usuarios.shared";

export type { TiendaFormOption, UsuariosCatalog, UsuarioWritePayload } from "./usuarios.shared";

const PERFIL_SELECT = `
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
`;

function mapPerfilRow(row: Record<string, unknown>): Perfil {
  const rolData = row.roles as { id: number; nombre_rol: RolUsuario } | null;
  const tiendaData = row.tienda as {
    id: number;
    sucursal: string;
    region?: { id: number; nombre_region: string } | null;
  } | null;
  const regionData = row.region as { id: number; nombre_region: string } | null;

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
  };
}

export async function listUsuariosCatalog(): Promise<UsuariosCatalog> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { usuarios: [], roles: [], tiendas: [], regiones: [] };

  const [perfilesRes, rolesRes, tiendasRes, regionesRes] = await Promise.all([
    supabase.from("perfiles").select(PERFIL_SELECT),
    supabase.from("roles").select("id, nombre_rol").order("id"),
    supabase.from("tiendas").select("id, sucursal, id_region").order("sucursal"),
    supabase.from("regiones").select("id, nombre_region").order("nombre_region"),
  ]);

  if (perfilesRes.error) throw new Error(perfilesRes.error.message);
  if (rolesRes.error) throw new Error(rolesRes.error.message);
  if (tiendasRes.error) throw new Error(tiendasRes.error.message);
  if (regionesRes.error) throw new Error(regionesRes.error.message);

  return {
    usuarios: (perfilesRes.data || []).map((row) => mapPerfilRow(row as Record<string, unknown>)),
    roles: (rolesRes.data || []) as Rol[],
    tiendas: (tiendasRes.data || []) as TiendaFormOption[],
    regiones: (regionesRes.data || []) as Pick<Region, "id" | "nombre_region">[],
  };
}

function mapWriteError(err: { code?: string; message: string }): string {
  if (err.code === "23505") return "Ya existe un usuario con ese correo.";
  return err.message;
}

export async function createUsuario(payload: UsuarioWritePayload): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };
  if (!payload.password) return { error: "La contraseña es obligatoria al crear un usuario." };

  const { error } = await supabase.from("perfiles").insert({
    email: payload.email,
    password: payload.password,
    nombre_completo: payload.nombre_completo,
    id_rol: payload.id_rol,
    id_tienda: payload.id_tienda,
    id_region: payload.id_region,
  });

  return { error: error ? mapWriteError(error) : null };
}

export async function updateUsuario(
  id: number,
  payload: UsuarioWritePayload,
  currentUserId: number,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };
  if (currentUserId === id) return { error: "No puedes modificar tu propia cuenta." };

  const updateBody: Record<string, unknown> = {
    email: payload.email,
    nombre_completo: payload.nombre_completo,
    id_rol: payload.id_rol,
    id_tienda: payload.id_tienda,
    id_region: payload.id_region,
  };
  if (payload.password) updateBody.password = payload.password;

  const { error } = await supabase.from("perfiles").update(updateBody).eq("id", id);
  return { error: error ? mapWriteError(error) : null };
}

export async function deleteUsuario(id: number): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error: clearErr } = await supabase
    .from("solicitudes")
    .update({ id_admin_revisor: null })
    .eq("id_admin_revisor", id);

  if (clearErr) return { error: clearErr.message };

  const { error: delErr } = await supabase.from("perfiles").delete().eq("id", id);
  return { error: delErr?.message ?? null };
}
