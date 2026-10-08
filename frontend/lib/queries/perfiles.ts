import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import { isOwnerAdminEmail, resolveSessionRol } from "../owner-admin";
import type { Perfil, RolUsuario } from "@/types";

const PERFIL_SELECT =
  "id, email, nombre_completo, id_rol, id_tienda, id_region, created_at, roles:id_rol(id, nombre_rol)";

export async function getPerfilById(
  userId: number,
): Promise<{ perfil: Perfil; rol: RolUsuario | null } | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("perfiles").select(PERFIL_SELECT).eq("id", userId).single();

  if (error || !data) return null;

  const rawRol = data.roles;
  const rolData = (Array.isArray(rawRol) ? rawRol[0] : rawRol) as
    | { id: number; nombre_rol: RolUsuario }
    | null
    | undefined;

  const perfil: Perfil = {
    id: data.id,
    email: data.email,
    nombre_completo: data.nombre_completo,
    id_rol: isOwnerAdminEmail(data.email) ? 1 : data.id_rol,
    id_tienda: isOwnerAdminEmail(data.email) ? null : data.id_tienda,
    id_region: isOwnerAdminEmail(data.email) ? null : data.id_region,
    created_at: data.created_at,
  };

  return { perfil, rol: resolveSessionRol(perfil.email, rolData?.nombre_rol ?? null) };
}
