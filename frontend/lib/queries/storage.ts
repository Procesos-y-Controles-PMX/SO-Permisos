import "server-only";

import { createSupabaseServerClient } from "../supabase-server";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "permisos-bucket";

function sanitizePermitName(nombrePermiso: string): string {
  return nombrePermiso.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
}

export function getFileNameFromPath(filePath: string): string {
  const segment = filePath.split("/").filter(Boolean).pop();
  return segment || "documento";
}

export async function uploadSolicitudFile(
  file: File,
  idTienda: number,
  nombrePermiso: string,
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { path: null, error: "Servidor sin configuración de base de datos." };

  const safePermitName = sanitizePermitName(nombrePermiso);
  const extension = file.name.split(".").pop() || "pdf";
  const filePath = `solicitudes/${idTienda}/${safePermitName}_solicitud.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) return { path: null, error: error.message };
  return { path: filePath, error: null };
}

export async function uploadActiveFile(
  file: File,
  idTienda: number,
  nombrePermiso: string,
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { path: null, error: "Servidor sin configuración de base de datos." };

  const safePermitName = sanitizePermitName(nombrePermiso);
  const extension = file.name.split(".").pop() || "pdf";
  const filePath = `activos/${idTienda}/${safePermitName}_activo.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) return { path: null, error: error.message };
  return { path: filePath, error: null };
}

export async function promoteFile(
  oldPath: string,
  idTienda: number,
  nombrePermiso: string,
): Promise<{ newPath: string | null; error: string | null }> {
  if (!oldPath) return { newPath: null, error: "Ruta original vacía" };

  const supabase = createSupabaseServerClient();
  if (!supabase) return { newPath: null, error: "Servidor sin configuración de base de datos." };

  const safePermitName = sanitizePermitName(nombrePermiso);
  const extension = oldPath.split(".").pop() || "pdf";
  const newPath = `activos/${idTienda}/${safePermitName}_activo.${extension}`;

  const { error: moveErr } = await supabase.storage.from(BUCKET).move(oldPath, newPath);
  if (moveErr) return { newPath: null, error: moveErr.message };
  return { newPath, error: null };
}

export async function deleteStorageFile(filePath: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data, error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "No se pudo eliminar el archivo del Storage (posible bloqueo de RLS)." };
  }
  return { error: null };
}

export async function createSignedFileUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { url: null, error: "Servidor sin configuración de base de datos." };

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}

export async function downloadStorageBlob(
  filePath: string,
): Promise<{ blob: Blob | null; error: string | null; filename: string }> {
  const supabase = createSupabaseServerClient();
  const filename = getFileNameFromPath(filePath);
  if (!supabase) return { blob: null, error: "Servidor sin configuración de base de datos.", filename };

  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) return { blob: null, error: error.message, filename };
  if (!data) return { blob: null, error: "No se pudo obtener el archivo.", filename };
  return { blob: data, error: null, filename };
}
