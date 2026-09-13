import { apiGet, apiSend } from "./http";

export async function listNotificaciones() {
  return apiGet<unknown[]>("/api/notificaciones", []);
}

export async function markNotificacionRead(id: number): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/notificaciones",
    { op: "read", id },
    { error: "No se pudo marcar la notificación." },
  );
}

export async function markNotificacionesRead(ids: number[]): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/notificaciones",
    { op: "read-all", ids },
    { error: "No se pudieron marcar las notificaciones." },
  );
}
