import type { DescargasOptions } from "../queries/descargas.shared";
import { apiGet } from "./http";

export type { DescargasOptions } from "../queries/descargas.shared";

export async function listDescargasOptions(): Promise<DescargasOptions> {
  return apiGet<DescargasOptions>("/api/descargas/options", {
    regions: [],
    stores: [],
    permisosCatalogo: [],
  });
}
