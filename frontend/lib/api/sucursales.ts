import type {
  RegionWritePayload,
  SucursalesCatalog,
  TiendaWritePayload,
} from "../queries/sucursales.shared";
import { apiGet, apiSend } from "./http";

export type {
  RegionAdminRow,
  RegionWritePayload,
  SucursalesCatalog,
  TiendaAdminRow,
  TiendaWritePayload,
} from "../queries/sucursales.shared";

export async function listSucursalesCatalog(): Promise<SucursalesCatalog> {
  return apiGet<SucursalesCatalog>("/api/sucursales", {
    tiendas: [],
    regiones: [],
    catalogo: [],
  });
}

export async function getPermisosAsignados(idTienda: number): Promise<number[]> {
  return apiGet<number[]>(`/api/sucursales?permisosAsignados=${encodeURIComponent(String(idTienda))}`, []);
}

export async function createRegion(region: RegionWritePayload): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "create-region", region },
    { error: "No se pudo crear la región." },
  );
}

export async function updateRegion(
  id: number,
  region: RegionWritePayload,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "update-region", id, region },
    { error: "No se pudo actualizar la región." },
  );
}

export async function deleteRegion(id: number): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "delete-region", id },
    { error: "No se pudo eliminar la región." },
  );
}

export async function createTienda(
  tienda: TiendaWritePayload,
  permisosSeleccionados: number[],
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "create-tienda", tienda, permisosSeleccionados },
    { error: "No se pudo crear la sucursal." },
  );
}

export async function updateTienda(
  id: number,
  tienda: TiendaWritePayload,
  permisosSeleccionados: number[],
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "update-tienda", id, tienda, permisosSeleccionados },
    { error: "No se pudo actualizar la sucursal." },
  );
}

export async function deleteTienda(id: number): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/sucursales",
    { op: "delete-tienda", id },
    { error: "No se pudo eliminar la sucursal." },
  );
}
