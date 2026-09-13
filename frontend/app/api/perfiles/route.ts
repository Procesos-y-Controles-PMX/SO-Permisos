import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import { getPerfilById } from "@/lib/queries/perfiles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id") || session.actor.id);
    if (!Number.isFinite(id)) return jsonError("Identificador inválido.", 400);
    if (id !== session.actor.id) return jsonError("No autorizado.", 403);
    return jsonOk(await getPerfilById(id));
  } catch (err) {
    console.error("[api/perfiles GET]", err);
    return jsonError("No se pudo cargar el perfil.");
  }
}
