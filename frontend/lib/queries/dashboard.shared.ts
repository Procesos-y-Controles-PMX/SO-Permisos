export interface RegionalCount {
  id: number;
  nombre_region: string;
  vencidos: number;
  cumplimiento: number;
}

export interface StoreAlertDetail {
  id: number;
  tipo_alerta: "Faltante" | "Vencido";
  fecha_vencimiento: string | null;
  tienda: {
    id: number;
    sucursal: string;
    id_region: number;
    region: {
      nombre_region: string;
    } | null;
  } | null;
  tipo_permiso: {
    id: number;
    nombre_permiso: string;
  } | null;
}

export interface StoreSummary {
  id: number;
  sucursal: string;
  id_region: number;
  region: {
    nombre_region: string;
  } | null;
}

export type DashboardStats = {
  totalAlertas: number;
  totalRequirements: number;
  compliancePercentage: number;
  storeComplianceMap: Record<number, number>;
  regionalCounts: RegionalCount[];
  storesAlerts: StoreAlertDetail[];
  stores: StoreSummary[];
};
