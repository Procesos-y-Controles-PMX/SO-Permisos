import type { DashboardStats } from "../queries/dashboard.shared";
import { apiGet } from "./http";

export type {
  DashboardStats,
  RegionalCount,
  StoreAlertDetail,
  StoreSummary,
} from "../queries/dashboard.shared";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/api/dashboard?op=stats", {
    totalAlertas: 0,
    totalRequirements: 0,
    compliancePercentage: 0,
    storeComplianceMap: {},
    regionalCounts: [],
    storesAlerts: [],
    stores: [],
  });
}

export async function getStoreComplianceMap(): Promise<Record<number, number>> {
  return apiGet<Record<number, number>>("/api/dashboard?op=compliance", {});
}
