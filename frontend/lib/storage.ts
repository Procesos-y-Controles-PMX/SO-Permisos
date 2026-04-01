import { createClient } from '@/lib/supabase'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'permisos-bucket'

/**
 * Upload a file as a new request (solicitud).
 * Organized as: solicitudes/[id_tienda]/[nombre_permiso]_solicitud.pdf
 */
export async function uploadFile(
  file: File,
  idTienda: number,
  nombrePermiso: string
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createClient()

  // Sanitize permit name
  const safePermitName = nombrePermiso.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
  const extension = file.name.split('.').pop() || 'pdf'
  const filePath = `solicitudes/${idTienda}/${safePermitName}_solicitud.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if same permit is re-submitted
    })

  if (error) {
    return { path: null, error: error.message }
  }

  return { path: filePath, error: null }
}

/**
 * Promote a file from 'solicitudes' to 'activos'.
 * Returns the new path.
 */
export async function promoteFile(
  oldPath: string,
  idTienda: number,
  nombrePermiso: string
): Promise<{ newPath: string | null; error: string | null }> {
  if (!oldPath) return { newPath: null, error: 'Ruta original vacía' }

  const supabase = createClient()
  const safePermitName = nombrePermiso.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
  const extension = oldPath.split('.').pop() || 'pdf'
  const newPath = `activos/${idTienda}/${safePermitName}_activo.${extension}`

  // 1. Move the file (effectively Copy + Delete in Supabase)
  const { error: moveErr } = await supabase.storage
    .from(BUCKET)
    .move(oldPath, newPath)

  if (moveErr) {
    return { newPath: null, error: moveErr.message }
  }

  return { newPath, error: null }
}

/**
 * Get a signed URL for downloading a file (valid for 1 hour).
 */
export async function getFileUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) {
    return { url: null, error: error.message }
  }

  return { url: data.signedUrl, error: null }
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(
  filePath: string,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath])

  return { error: error?.message ?? null }
}
