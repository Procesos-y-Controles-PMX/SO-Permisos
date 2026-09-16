import type { CatalogoPermiso } from "@/types";

export interface PermisoAdminRow extends CatalogoPermiso {
  tiendaCount: number;
  vigenteCount: number;
  solicitudCount: number;
}

export type PermisoFormPayload = {
  nombre_permiso: string;
  ponderacion: number;
};
