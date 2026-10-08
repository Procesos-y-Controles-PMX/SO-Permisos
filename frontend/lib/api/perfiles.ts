import type { Perfil, RolUsuario } from "@/types";
import { apiGet } from "./http";

export async function getPerfilById(
  userId: number,
): Promise<{ perfil: Perfil; rol: RolUsuario | null } | null> {
  return apiGet<{ perfil: Perfil; rol: RolUsuario | null } | null>(
    `/api/perfiles?id=${encodeURIComponent(String(userId))}`,
    null,
  );
}
