import { jsonError, jsonOk, requireAdminSession, requireApiSession } from "@/lib/api-route";
import {
  deletePermisoVigente,
  expireExpiredVigentes,
  listPermisos,
  updatePermisoComentarios,
  updatePermisoVigencia,
  upsertPermisoVigente,
} from "@/lib/queries/permisos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listPermisos(session.actor));
  } catch (err) {
    console.error("[api/permisos GET]", err);
    return jsonError("No se pudieron cargar los permisos.");
  }
}

export async function POST(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as {
      op?: string;
      configId?: number;
      comentarios?: string | null;
      id_tienda?: number;
      id_tipo_permiso?: number;
      fecha_vencimiento?: string | null;
      payload?: {
        id_tienda: number;
        id_tipo_permiso: number;
        fecha_vencimiento?: string | null;
        estatus?: string;
        archivo_path?: string | null;
        puntaje?: number | null;
      };
    };

    if (body.op === "expire") {
      return jsonOk(await expireExpiredVigentes(body.id_tienda));
    }

    if (body.op === "update-comentarios" && body.configId !== undefined) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await updatePermisoComentarios(body.configId, body.comentarios ?? null));
    }

    if (body.op === "update-vigencia" && body.id_tienda && body.id_tipo_permiso) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(
        await updatePermisoVigencia(body.id_tienda, body.id_tipo_permiso, body.fecha_vencimiento ?? null),
      );
    }

    if (body.op === "upsert-vigente" && body.payload) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await upsertPermisoVigente(body.payload));
    }

    if (body.op === "delete-vigente" && body.id_tienda && body.id_tipo_permiso) {
      const admin = requireAdminSession(request);
      if (!admin.ok) return admin.response;
      return jsonOk(await deletePermisoVigente(body.id_tienda, body.id_tipo_permiso));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/permisos POST]", err);
    return jsonError("No se pudo completar la operación de permisos.");
  }
}
