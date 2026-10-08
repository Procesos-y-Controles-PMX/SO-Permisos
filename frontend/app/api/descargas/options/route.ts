import { jsonError, jsonOk, requireAdminSession } from "@/lib/api-route";
import { listDescargasOptions } from "@/lib/queries/descargas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    return jsonOk(await listDescargasOptions());
  } catch (err) {
    console.error("[api/descargas/options GET]", err);
    return jsonError("No se pudieron cargar regiones/tiendas.");
  }
}
