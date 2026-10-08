import type { UsuariosCatalog, UsuarioWritePayload } from "../queries/usuarios.shared";
import { apiGet, apiSend } from "./http";

export type { UsuariosCatalog, UsuarioWritePayload, TiendaFormOption } from "../queries/usuarios.shared";

export async function listUsuariosCatalog(): Promise<UsuariosCatalog> {
  return apiGet<UsuariosCatalog>("/api/usuarios", {
    usuarios: [],
    roles: [],
    tiendas: [],
    regiones: [],
  });
}

export async function createUsuario(payload: UsuarioWritePayload): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/usuarios",
    { op: "create", payload },
    { error: "No se pudo crear el usuario." },
  );
}

export async function updateUsuario(
  id: number,
  payload: UsuarioWritePayload,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/usuarios",
    { op: "update", id, payload },
    { error: "No se pudo actualizar el usuario." },
  );
}

export async function deleteUsuario(id: number): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    "/api/usuarios",
    { op: "delete", id },
    { error: "No se pudo eliminar el usuario." },
  );
}
