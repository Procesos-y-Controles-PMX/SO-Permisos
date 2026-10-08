import type { TiendaDetalle } from "../queries/tienda-detalle.shared";
import { apiGet } from "./http";

export type { TiendaDetalle } from "../queries/tienda-detalle.shared";

export async function getTiendaDetalle(idTienda: number): Promise<TiendaDetalle> {
  return apiGet<TiendaDetalle>(`/api/tienda-detalle?id=${encodeURIComponent(String(idTienda))}`, {
    tienda: null,
    permisos: [],
    solicitudes: [],
  });
}
