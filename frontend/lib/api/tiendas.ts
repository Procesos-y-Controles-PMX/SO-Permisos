import { apiGet } from "./http";

export async function listTiendas() {
  return apiGet<unknown[]>("/api/tiendas", []);
}
