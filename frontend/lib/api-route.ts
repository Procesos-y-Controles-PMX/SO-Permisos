import { NextResponse } from "next/server";
import { isOwnerAdminEmail } from "./owner-admin";
import { parseSessionActorHeader, type SessionActor } from "./session-actor";

export function unauthorizedResponse() {
  return NextResponse.json({ ok: false, message: "Sesión requerida." }, { status: 401 });
}

export function forbiddenResponse(message = "No autorizado.") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export function requireApiSession(
  request: Request,
): { ok: true; actor: SessionActor } | { ok: false; response: NextResponse } {
  const actor = parseSessionActorHeader(request);
  if (!actor) return { ok: false, response: unauthorizedResponse() };
  return { ok: true, actor };
}

export function isAdminActor(actor: SessionActor): boolean {
  return actor.rol === "Admin" || isOwnerAdminEmail(actor.email);
}

export function requireAdminSession(
  request: Request,
): { ok: true; actor: SessionActor } | { ok: false; response: NextResponse } {
  const session = requireApiSession(request);
  if (!session.ok) return session;
  if (!isAdminActor(session.actor)) {
    return { ok: false, response: forbiddenResponse() };
  }
  return session;
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, message, error: message }, { status });
}
