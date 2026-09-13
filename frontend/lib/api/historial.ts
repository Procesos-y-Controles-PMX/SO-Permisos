import type { HistorialPermisoItem } from "../queries/historial.shared";
import { apiGet } from "./http";

export type { HistorialPermisoItem } from "../queries/historial.shared";

export async function listHistorial(): Promise<HistorialPermisoItem[]> {
  return apiGet<HistorialPermisoItem[]>("/api/historial", []);
}
