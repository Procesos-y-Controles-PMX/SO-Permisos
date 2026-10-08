import { jsonError, jsonOk, requireAdminSession } from "@/lib/api-route";
import {
  createCatalogoPermiso,
  deleteCatalogoPermiso,
  listCatalogoPermisosAdmin,
  updateCatalogoPermiso,
  type PermisoFormPayload,
} from "@/lib/queries/catalogo-permisos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listCatalogoPermisosAdmin());
  } catch (err) {
    console.error("[api/catalogo-permisos GET]", err);
    return jsonError("No se pudieron cargar los permisos del catálogo.");
  }
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as {
      op?: string;
      id?: number;
      payload?: PermisoFormPayload;
    };

    if (body.op === "create" && body.payload) {
      return jsonOk(await createCatalogoPermiso(body.payload));
    }
    if (body.op === "update" && body.id && body.payload) {
      return jsonOk(await updateCatalogoPermiso(body.id, body.payload));
    }
    if (body.op === "delete" && body.id) {
      return jsonOk(await deleteCatalogoPermiso(body.id));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/catalogo-permisos POST]", err);
    return jsonError("No se pudo completar la operación del catálogo.");
  }
}
