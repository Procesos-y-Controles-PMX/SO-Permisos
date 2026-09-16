import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import {
  listNotificaciones,
  markNotificacionRead,
  markNotificacionesRead,
} from "@/lib/queries/notificaciones";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listNotificaciones(session.actor.id));
  } catch (err) {
    console.error("[api/notificaciones GET]", err);
    return jsonError("No se pudieron cargar las notificaciones.");
  }
}

export async function POST(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as { op?: string; id?: number; ids?: number[] };
    if (body.op === "read" && body.id) {
      return jsonOk(await markNotificacionRead(body.id));
    }
    if (body.op === "read-all" && body.ids) {
      return jsonOk(await markNotificacionesRead(body.ids));
    }
    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/notificaciones POST]", err);
    return jsonError("No se pudieron actualizar las notificaciones.");
  }
}
