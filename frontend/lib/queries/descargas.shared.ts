export type DescargasOptions = {
  regions: { id: number; nombre_region: string }[];
  stores: { id: number; sucursal: string | null; id_region: number | null }[];
  permisosCatalogo: { id: number; nombre_permiso: string }[];
};
