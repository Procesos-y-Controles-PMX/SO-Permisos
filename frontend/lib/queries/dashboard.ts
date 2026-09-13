import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { SessionActor } from "../session-actor";
import { ACTIVE_STATUSES, firstJoin } from "./helpers";
import type {
  DashboardStats,
  RegionalCount,
  StoreAlertDetail,
  StoreSummary,
} from "./dashboard.shared";

export type {
  DashboardStats,
  RegionalCount,
  StoreAlertDetail,
  StoreSummary,
} from "./dashboard.shared";

const emptyStats = (): DashboardStats => ({
  totalAlertas: 0,
  totalRequirements: 0,
  compliancePercentage: 0,
  storeComplianceMap: {},
  regionalCounts: [],
  storesAlerts: [],
  stores: [],
});

export async function getDashboardStats(actor: SessionActor): Promise<DashboardStats> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return emptyStats();

  let query = supabase
    .from("configuracion_tienda_permisos")
    .select(`
      id,
      id_tienda,
      obligatorio,
      tienda:id_tienda!inner(id, sucursal, id_region, region:id_region(id, nombre_region)),
      tipo_permiso:id_tipo_permiso(id, nombre_permiso),
      permiso_vigente:permisos_vigentes(id, estatus, fecha_vencimiento)
    `)
    .eq("obligatorio", true);

  if (actor.rol === "Regional" && actor.id_region) {
    query = query.eq("tienda.id_region", actor.id_region);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rawData = data || [];
  const allStoresMap = new Map<number, StoreSummary>();
  rawData.forEach((item) => {
    const tienda = firstJoin(item.tienda as StoreSummary | StoreSummary[]);
    if (tienda?.id && !allStoresMap.has(tienda.id)) {
      allStoresMap.set(tienda.id, tienda);
    }
  });

  const allAlertsRaw = rawData
    .map((item) => {
      const vigente = firstJoin(item.permiso_vigente as { estatus?: string; fecha_vencimiento?: string } | { estatus?: string; fecha_vencimiento?: string }[]);
      const isExpiredByDate = Boolean(
        vigente?.fecha_vencimiento &&
          new Date(vigente.fecha_vencimiento).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0),
      );

      let tipo_alerta: "Faltante" | "Vencido" | null = null;
      if (!vigente) {
        tipo_alerta = "Faltante";
      } else if (!ACTIVE_STATUSES.has(vigente.estatus || "") || isExpiredByDate) {
        tipo_alerta = "Vencido";
      }

      if (!tipo_alerta) return null;
      return {
        id: item.id,
        tipo_alerta,
        fecha_vencimiento: vigente?.fecha_vencimiento || null,
        tienda: item.tienda,
        tipo_permiso: item.tipo_permiso,
      } as StoreAlertDetail;
    })
    .filter(Boolean) as StoreAlertDetail[];

  const globalCompliance =
    rawData.length > 0
      ? Math.round(((rawData.length - allAlertsRaw.length) / rawData.length) * 1000) / 10
      : 0;

  const storeMap: Record<number, { total: number; alerts: number }> = {};
  rawData.forEach((item) => {
    const tid = item.id_tienda as number;
    if (!storeMap[tid]) storeMap[tid] = { total: 0, alerts: 0 };
    storeMap[tid].total++;
  });
  allAlertsRaw.forEach((alert) => {
    const tid = alert.tienda?.id;
    if (tid && storeMap[tid]) storeMap[tid].alerts++;
  });

  const finalStoreCompliance: Record<number, number> = {};
  Object.keys(storeMap).forEach((tid) => {
    const id = Number(tid);
    const s = storeMap[id];
    finalStoreCompliance[id] = s.total > 0 ? Math.round(((s.total - s.alerts) / s.total) * 1000) / 10 : 0;
  });

  let regionalCounts: RegionalCount[] = [];
  if (actor.rol === "Admin") {
    const { data: regiones } = await supabase.from("regiones").select("id, nombre_region").order("nombre_region");
    if (regiones) {
      regionalCounts = regiones.map((reg) => {
        const regReqs = rawData.filter((r) => {
          const t = firstJoin(r.tienda as StoreSummary | StoreSummary[]);
          return t?.id_region === reg.id;
        }).length;
        const regAlerts = allAlertsRaw.filter((a) => {
          const t = Array.isArray(a.tienda) ? a.tienda[0] : a.tienda;
          return t?.id_region === reg.id;
        }).length;
        return {
          id: reg.id,
          nombre_region: reg.nombre_region,
          vencidos: regAlerts,
          cumplimiento: regReqs > 0 ? Math.round(((regReqs - regAlerts) / regReqs) * 1000) / 10 : 0,
        };
      });
    }
  }

  return {
    totalAlertas: allAlertsRaw.length,
    totalRequirements: rawData.length,
    compliancePercentage: globalCompliance,
    storeComplianceMap: finalStoreCompliance,
    regionalCounts,
    storesAlerts: allAlertsRaw,
    stores: Array.from(allStoresMap.values()),
  };
}

export async function getStoreComplianceMap(): Promise<Record<number, number>> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("configuracion_tienda_permisos")
    .select(`
      id_tienda,
      obligatorio,
      permiso_vigente:permisos_vigentes(id, estatus)
    `)
    .eq("obligatorio", true);

  if (error) throw new Error(error.message);

  const storeMap: Record<number, { total: number; alerts: number }> = {};
  (data || []).forEach((item) => {
    const tid = item.id_tienda as number;
    if (!storeMap[tid]) storeMap[tid] = { total: 0, alerts: 0 };
    storeMap[tid].total++;

    const vigente = firstJoin(item.permiso_vigente as { estatus?: string } | { estatus?: string }[]);
    const isAlert = !vigente || !ACTIVE_STATUSES.has(vigente.estatus || "");
    if (isAlert) storeMap[tid].alerts++;
  });

  const finalStoreCompliance: Record<number, number> = {};
  Object.keys(storeMap).forEach((tid) => {
    const id = Number(tid);
    const s = storeMap[id];
    finalStoreCompliance[id] = s.total > 0 ? Math.round(((s.total - s.alerts) / s.total) * 1000) / 10 : 0;
  });
  return finalStoreCompliance;
}
