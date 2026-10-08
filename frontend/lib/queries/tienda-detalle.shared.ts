import type { ConfiguracionTiendaPermiso } from "@/types";

export type TiendaDetalle = {
  tienda: Record<string, unknown> | null;
  permisos: ConfiguracionTiendaPermiso[];
  solicitudes: unknown[];
};
