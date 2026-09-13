import "server-only";

import type { SessionActor } from "../session-actor";
import { isOwnerAdminEmail } from "../owner-admin";

export const ACTIVE_STATUSES = new Set(["Activo", "Aprobado"]);

export function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isAdminActor(actor: SessionActor): boolean {
  return actor.rol === "Admin" || isOwnerAdminEmail(actor.email);
}

export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isExpiredDate(dateValue: string | null | undefined): boolean {
  if (!dateValue) return false;
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

export function optionalString(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}
