import type { CatalogoPermiso, Region, Tienda } from "@/types";

export interface TiendaAdminRow extends Tienda {
  permisoCount: number;
}

export interface RegionAdminRow
  extends Pick<Region, "id" | "nombre_region" | "gerente_regional" | "celular" | "correo"> {
  tiendaCount: number;
  usuarioCount: number;
}

export type SucursalesCatalog = {
  tiendas: TiendaAdminRow[];
  regiones: RegionAdminRow[];
  catalogo: CatalogoPermiso[];
};

export type RegionWritePayload = {
  nombre_region: string;
  gerente_regional: string;
  celular: string | null;
  correo: string;
};

export type TiendaWritePayload = {
  sucursal: string;
  id_region: number | null;
  centro: string | null;
  cc: string | null;
  gerente_tienda: string;
  celular: string | null;
  correo: string;
  direccion_sucursal: string | null;
};
