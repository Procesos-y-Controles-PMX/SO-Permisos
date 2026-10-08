import type { ConfiguracionTiendaPermiso } from "@/types";
import { apiGet, apiSend } from "./http";

export async function listPermisos(): Promise<ConfiguracionTiendaPermiso[]> {
  return apiGet<ConfiguracionTiendaPermiso[]>("/api/permisos", []);
}

export async function expireExpiredVigentes(idTienda?: number): Promise<{ expired: number }> {
  return apiSend<{ expired: number }>("/api/permisos", { op: "expire", id_tienda: idTienda }, { expired: 0 });
}

export async function updatePermisoComentarios(
  configId: number,
  comentarios: string | null,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/permisos",
    { op: "update-comentarios", configId, comentarios },
    { error: "No se pudieron guardar las notas." },
  );
}

export async function updatePermisoVigencia(
  idTienda: number,
  idTipoPermiso: number,
  fechaVencimiento: string | null,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/permisos",
    {
      op: "update-vigencia",
      id_tienda: idTienda,
      id_tipo_permiso: idTipoPermiso,
      fecha_vencimiento: fechaVencimiento,
    },
    { error: "No se pudo actualizar la vigencia." },
  );
}

export async function upsertPermisoVigente(payload: {
  id_tienda: number;
  id_tipo_permiso: number;
  fecha_vencimiento?: string | null;
  estatus?: string;
  archivo_path?: string | null;
  puntaje?: number | null;
}): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/permisos",
    { op: "upsert-vigente", payload },
    { error: "No se pudo actualizar el permiso vigente." },
  );
}

export async function deletePermisoVigente(
  idTienda: number,
  idTipoPermiso: number,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/permisos",
    { op: "delete-vigente", id_tienda: idTienda, id_tipo_permiso: idTipoPermiso },
    { error: "No se pudo eliminar el permiso vigente." },
  );
}
