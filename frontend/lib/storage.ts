import { apiDownload, apiSend, apiSendForm } from '@/lib/api/http'

/**
 * Extract file name from a storage path (last segment).
 */
export function getFileNameFromPath(filePath: string): string {
  const segment = filePath.split('/').filter(Boolean).pop()
  return segment || 'documento'
}

/**
 * Upload a file as a new request (solicitud).
 * Organized as: solicitudes/[id_tienda]/[nombre_permiso]_solicitud.pdf
 */
export async function uploadFile(
  file: File,
  idTienda: number,
  nombrePermiso: string
): Promise<{ path: string | null; error: string | null }> {
  const form = new FormData()
  form.set('op', 'upload')
  form.set('file', file)
  form.set('idTienda', String(idTienda))
  form.set('nombrePermiso', nombrePermiso)
  return apiSendForm<{ path: string | null; error: string | null }>(
    '/api/storage',
    form,
    { path: null, error: 'No se pudo subir el archivo.' },
  )
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
  return apiSend<{ newPath: string | null; error: string | null }>(
    '/api/storage',
    { op: 'promote', path: oldPath, idTienda, nombrePermiso },
    { newPath: null, error: 'No se pudo mover el archivo.' },
  )
}

/**
 * Download a file from storage and trigger a browser save dialog.
 */
export async function downloadStorageFile(
  filePath: string,
  downloadName?: string,
): Promise<{ error: string | null }> {
  const { blob, error, filename } = await apiDownload(
    `/api/storage?op=download&path=${encodeURIComponent(filePath)}`,
  )
  if (error || !blob) return { error: error || 'No se pudo obtener el archivo.' }

  const fileName = downloadName || filename || getFileNameFromPath(filePath)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return { error: null }
}

/**
 * Get a signed URL for viewing a file (valid for 1 hour).
 */
export async function getFileUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  return apiSend<{ url: string | null; error: string | null }>(
    '/api/storage',
    { op: 'url', path: filePath },
    { url: null, error: 'No se pudo obtener la URL del archivo.' },
  )
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(
  filePath: string,
): Promise<{ error: string | null }> {
  return apiSend<{ error: string | null }>(
    '/api/storage',
    { op: 'delete', path: filePath },
    { error: 'No se pudo eliminar el archivo.' },
  )
}

/**
 * Upload a file directly as an active file (bypass).
 * Organized as: activos/[id_tienda]/[nombre_permiso]_activo.pdf
 */
export async function uploadActiveFile(
  file: File,
  idTienda: number,
  nombrePermiso: string
): Promise<{ path: string | null; error: string | null }> {
  const form = new FormData()
  form.set('op', 'upload-active')
  form.set('file', file)
  form.set('idTienda', String(idTienda))
  form.set('nombrePermiso', nombrePermiso)
  return apiSendForm<{ path: string | null; error: string | null }>(
    '/api/storage',
    form,
    { path: null, error: 'No se pudo subir el archivo.' },
  )
}
