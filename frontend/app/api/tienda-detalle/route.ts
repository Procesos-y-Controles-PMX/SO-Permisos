import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import { getTiendaDetalle } from "@/lib/queries/tienda-detalle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return jsonError("Identificador inválido.", 400);
    return jsonOk(await getTiendaDetalle(id));
  } catch (err) {
    console.error("[api/tienda-detalle GET]", err);
    return jsonError("No se pudo cargar el detalle de la tienda.");
  }
}
