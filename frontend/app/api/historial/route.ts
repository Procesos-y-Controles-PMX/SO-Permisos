import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import { listHistorial } from "@/lib/queries/historial";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const idTienda = session.actor.id_tienda;
    if (!idTienda) return jsonOk([]);
    return jsonOk(await listHistorial(idTienda));
  } catch (err) {
    console.error("[api/historial GET]", err);
    return jsonError("No se pudo cargar el historial.");
  }
}
