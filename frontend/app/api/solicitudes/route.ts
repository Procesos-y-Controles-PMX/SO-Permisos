import { jsonError, jsonOk, requireAdminSession, requireApiSession } from "@/lib/api-route";
import {
  aprobarSolicitud,
  createSolicitud,
  listSolicitudes,
  listSolicitudesPendientes,
  rechazarSolicitud,
} from "@/lib/queries/solicitudes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("pendientes") === "1") {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await listSolicitudesPendientes());
    }
    const idTiendaRaw = searchParams.get("idTienda");
    const idTienda = idTiendaRaw ? Number(idTiendaRaw) : undefined;
    return jsonOk(await listSolicitudes(session.actor, idTienda));
  } catch (err) {
    console.error("[api/solicitudes GET]", err);
    return jsonError("No se pudieron cargar las solicitudes.");
  }
}

export async function POST(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as {
      op?: string;
      id?: number;
      comentarios?: string;
      payload?: {
        id_tienda: number;
        id_tipo_permiso: number;
        vigencia_propuesta: string | null;
        archivo_adjunto_path: string | null;
      };
    };

    if (body.op === "create" && body.payload) {
      return jsonOk(await createSolicitud(body.payload));
    }

    if (body.op === "aprobar" && body.id) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await aprobarSolicitud(body.id, body.comentarios, session.actor.id));
    }

    if (body.op === "rechazar" && body.id && body.comentarios) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await rechazarSolicitud(body.id, body.comentarios, session.actor.id));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/solicitudes POST]", err);
    return jsonError("No se pudo completar la operación de solicitud.");
  }
}
