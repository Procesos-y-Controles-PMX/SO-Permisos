import "server-only";

import { createSupabaseServerClient } from "../supabase-server";

export async function listNotificaciones(userId: number) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("id_usuario", userId)
    .order("fecha_creacion", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function markNotificacionRead(id: number): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function markNotificacionesRead(ids: number[]): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };
  if (ids.length === 0) return { error: null };

  const { error } = await supabase.from("notificaciones").update({ leida: true }).in("id", ids);
  return { error: error?.message ?? null };
}
