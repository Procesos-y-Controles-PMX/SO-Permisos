import type { RolUsuario } from "@/types";

export const SESSION_STORAGE_KEY = "permisos_user";
export const PERMISOS_USER_HEADER = "x-permisos-user";

export type SessionActor = {
  id: number;
  email: string;
  rol: RolUsuario;
  id_tienda: number | null;
  id_region: number | null;
};

function asRol(value: unknown): RolUsuario | null {
  if (value === "Admin" || value === "Tienda" || value === "Regional") return value;
  return null;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseActorPayload(value: unknown): SessionActor | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const perfil =
    record.perfil && typeof record.perfil === "object"
      ? (record.perfil as Record<string, unknown>)
      : record;

  const rawId = perfil.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  const email = typeof perfil.email === "string" ? perfil.email : "";
  if (!Number.isFinite(id) || id <= 0 || !email) return null;

  const rol = asRol(record.rol) ?? asRol(perfil.rol);
  if (!rol) return null;

  return {
    id,
    email,
    rol,
    id_tienda: asNullableNumber(perfil.id_tienda),
    id_region: asNullableNumber(perfil.id_region),
  };
}

export function parseSessionActorHeader(request: Request): SessionActor | null {
  const raw = request.headers.get(PERMISOS_USER_HEADER);
  if (!raw) return null;
  try {
    return parseActorPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Reads the browser session actor for API headers. Safe to call on the server (returns null). */
export function readSessionActor(): SessionActor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return parseActorPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}
