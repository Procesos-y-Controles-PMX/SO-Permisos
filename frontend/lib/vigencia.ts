export const VIGENCIA_SIN_FECHA_LABEL = 'Sin vencimiento'

export function getTodayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isPastDate(dateValue: string | null | undefined): boolean {
  if (!dateValue) return false
  return dateValue < getTodayDateString()
}

export function formatFechaVigencia(date: string | null | undefined): string {
  if (!date) return VIGENCIA_SIN_FECHA_LABEL
  try {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

export function canSubmitVigencia(fecha: string, sinVencimiento: boolean): boolean {
  return sinVencimiento || Boolean(fecha.trim())
}

export function resolveVigenciaParaGuardar(
  fecha: string,
  sinVencimiento: boolean,
): { value: string | null; error: string | null } {
  if (sinVencimiento) {
    return { value: null, error: null }
  }

  const trimmed = fecha.trim()
  if (!trimmed) {
    return { value: null, error: 'Selecciona una fecha de vigencia o marca "Sin fecha de vencimiento".' }
  }

  if (isPastDate(trimmed)) {
    return { value: null, error: 'La fecha de vigencia no puede ser anterior al día de hoy.' }
  }

  return { value: trimmed, error: null }
}

export function resetVigenciaFormState(): { vigencia: string; sinVencimiento: boolean } {
  return { vigencia: '', sinVencimiento: false }
}
