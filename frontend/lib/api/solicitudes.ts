import { apiGet, apiSend } from "./http";

export async function listSolicitudes(idTienda?: number) {
  const params = new URLSearchParams();
  if (idTienda) params.set("idTienda", String(idTienda));
  const path = `/api/solicitudes${params.size ? `?${params.toString()}` : ""}`;
  return apiGet<unknown[]>(path, []);
}

export async function listSolicitudesPendientes() {
  return apiGet<unknown[]>("/api/solicitudes?pendientes=1", []);
}

export async function createSolicitud(payload: {
  id_tienda: number;
  id_tipo_permiso: number;
  vigencia_propuesta: string | null;
  archivo_adjunto_path: string | null;
}): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/solicitudes",
    { op: "create", payload },
    { error: "No se pudo crear la solicitud." },
  );
}

export async function aprobarSolicitud(
  id: number,
  comentarios?: string,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/solicitudes",
    { op: "aprobar", id, comentarios },
    { error: "No se pudo aprobar la solicitud." },
  );
}

export async function rechazarSolicitud(
  id: number,
  comentarios: string,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/solicitudes",
    { op: "rechazar", id, comentarios },
    { error: "No se pudo rechazar la solicitud." },
  );
}
