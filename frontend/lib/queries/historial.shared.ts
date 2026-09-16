import type { HistorialPermisoEstado } from "@/types";

export type HistorialPermisoItem = {
  configId: number;
  idTienda: number;
  idTipoPermiso: number;
  nombrePermiso: string;
  obligatorio: boolean;
  estado: HistorialPermisoEstado;
  fechaActualizacion: string | null;
  vigencia: string | null;
  archivoPath: string | null;
  comentariosAdmin: string | null;
  notasPermiso: string | null;
};
