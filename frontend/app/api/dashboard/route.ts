import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import { getDashboardStats, getStoreComplianceMap } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const op = searchParams.get("op") ?? "stats";
    if (op === "compliance") return jsonOk(await getStoreComplianceMap());
    return jsonOk(await getDashboardStats(session.actor));
  } catch (err) {
    console.error("[api/dashboard GET]", err);
    return jsonError("No se pudieron cargar las métricas.");
  }
}
