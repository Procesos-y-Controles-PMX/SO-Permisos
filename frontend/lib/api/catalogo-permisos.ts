import type { PermisoAdminRow, PermisoFormPayload } from "../queries/catalogo-permisos.shared";
import { apiGet, apiSend } from "./http";

export type { PermisoAdminRow, PermisoFormPayload } from "../queries/catalogo-permisos.shared";

export async function listCatalogoPermisosAdmin(): Promise<PermisoAdminRow[]> {
  return apiGet<PermisoAdminRow[]>("/api/catalogo-permisos", []);
}

export async function createCatalogoPermiso(
  payload: PermisoFormPayload,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/catalogo-permisos",
    { op: "create", payload },
    { error: "No se pudo crear el permiso." },
  );
}

export async function updateCatalogoPermiso(
  id: number,
  payload: PermisoFormPayload,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/catalogo-permisos",
    { op: "update", id, payload },
    { error: "No se pudo actualizar el permiso." },
  );
}

export async function deleteCatalogoPermiso(id: number): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/catalogo-permisos",
    { op: "delete", id },
    { error: "No se pudo eliminar el permiso." },
  );
}
