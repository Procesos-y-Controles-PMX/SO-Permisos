import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { SessionActor } from "../session-actor";

export async function listTiendas(actor: SessionActor) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("tiendas")
    .select("*, region:id_region(id, nombre_region, gerente_regional, celular, correo)")
    .order("sucursal");

  if (actor.rol === "Tienda" && actor.id_tienda) {
    query = query.eq("id", actor.id_tienda);
  } else if (actor.rol === "Regional" && actor.id_region) {
    query = query.eq("id_region", actor.id_region);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
