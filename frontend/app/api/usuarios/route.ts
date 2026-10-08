import { jsonError, jsonOk, requireAdminSession } from "@/lib/api-route";
import {
  createUsuario,
  deleteUsuario,
  listUsuariosCatalog,
  updateUsuario,
  type UsuarioWritePayload,
} from "@/lib/queries/usuarios";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listUsuariosCatalog());
  } catch (err) {
    console.error("[api/usuarios GET]", err);
    return jsonError("No se pudieron cargar los usuarios.");
  }
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as {
      op?: string;
      id?: number;
      payload?: UsuarioWritePayload;
    };

    if (body.op === "create" && body.payload) {
      return jsonOk(await createUsuario(body.payload));
    }
    if (body.op === "update" && body.id && body.payload) {
      return jsonOk(await updateUsuario(body.id, body.payload, session.actor.id));
    }
    if (body.op === "delete" && body.id) {
      return jsonOk(await deleteUsuario(body.id));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/usuarios POST]", err);
    return jsonError("No se pudo completar la operación de usuario.");
  }
}
