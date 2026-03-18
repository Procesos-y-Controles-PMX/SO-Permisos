import { createClient } from '@/lib/supabase'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'permisos-bucket'

/**
 * Upload a file to Supabase Storage.
 * Files are organized as: tienda_{id_tienda}/{filename}
 */
export async function uploadFile(
  file: File,
  idTienda: number,
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createClient()

  // Create a unique filename to avoid collisions
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `tienda_${idTienda}/${timestamp}_${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: null, error: error.message }
  }

  return { path: filePath, error: null }
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
