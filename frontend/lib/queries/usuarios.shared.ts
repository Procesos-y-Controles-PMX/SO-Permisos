import type { Perfil, Region, Rol, Tienda } from "@/types";

export type TiendaFormOption = Pick<Tienda, "id" | "sucursal" | "id_region">;

export type UsuariosCatalog = {
  usuarios: Perfil[];
  roles: Rol[];
  tiendas: TiendaFormOption[];
  regiones: Pick<Region, "id" | "nombre_region">[];
};

export type UsuarioWritePayload = {
  email: string;
  nombre_completo: string | null;
  id_rol: number;
  id_tienda: number | null;
  id_region: number | null;
  password?: string;
};
