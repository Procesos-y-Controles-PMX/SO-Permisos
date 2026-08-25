import type { RolUsuario } from "@/types";

/** Platform owner. Highest Permisos role is Admin (id_rol 1). */
export const OWNER_ADMIN_EMAILS = ["fernando.corella@ext.cemex.com"] as const;

const OWNER_ADMIN_EMAIL_SET = new Set(OWNER_ADMIN_EMAILS.map((email) => email.trim().toLowerCase()));

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isOwnerAdminEmail(email: string | null | undefined) {
  return OWNER_ADMIN_EMAIL_SET.has(normalizeEmail(email));
}

export function rolDisplayName(nombre: string | null | undefined) {
  if (nombre === "Admin") return "Administrador";
  return nombre?.trim() || "—";
}

export function resolveSessionRol(
  email: string | null | undefined,
  rol: RolUsuario | null | undefined,
): RolUsuario | null {
  if (isOwnerAdminEmail(email)) return "Admin";
  return rol ?? null;
}
