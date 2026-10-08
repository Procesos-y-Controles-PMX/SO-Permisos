import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import { listTiendas } from "@/lib/queries/tiendas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listTiendas(session.actor));
  } catch (err) {
    console.error("[api/tiendas GET]", err);
    return jsonError("No se pudieron cargar las tiendas.");
  }
}
