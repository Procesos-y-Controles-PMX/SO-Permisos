'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import {
  ALERT_ERROR,
  ALERT_SUCCESS,
  FIELD_INPUT,
  PANEL_INSET,
} from '@/components/ui/contentStyles'
import { MAX_PERMISO_COMENTARIOS_LENGTH } from '@/hooks/usePermisoComentarios'

interface PermisoNotasPanelProps {
  comentarios: string | null | undefined
  canEdit: boolean
  onSave: (comentarios: string | null) => Promise<{ error: string | null }>
  compact?: boolean
  nombrePermiso?: string
}

export default function PermisoNotasPanel({
  comentarios,
  canEdit,
  onSave,
  compact = false,
  nombrePermiso,
}: PermisoNotasPanelProps) {
  const [draft, setDraft] = useState(comentarios ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(comentarios ?? '')
    setError(null)
    setSaved(false)
  }, [comentarios])

  const hasNotas = Boolean(comentarios?.trim())

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await onSave(draft)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleClear = async () => {
    setDraft('')
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await onSave(null)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const readOnlyBlock = (
    <div className={`${PANEL_INSET} ${compact ? 'p-2.5' : 'p-3'} ${!hasNotas ? 'bg-muted/50' : ''}`}>
      {hasNotas ? (
        <p
          className={`whitespace-pre-wrap leading-relaxed text-fg-strong ${
            compact ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          {comentarios}
        </p>
      ) : (
        <p className={`italic text-fg-faint ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
          Sin notas registradas
        </p>
      )}
    </div>
  )

  if (!canEdit) {
    return (
      <div className={compact ? 'mt-3' : 'space-y-2'}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-faint">
          Notas del permiso
        </p>
        {readOnlyBlock}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {nombrePermiso && (
        <p className="text-[12px] text-fg-subtle">
          Permiso: <span className="font-medium text-fg-strong">{nombrePermiso}</span>
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-faint">
          Notas del permiso
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_PERMISO_COMENTARIOS_LENGTH}
          rows={compact ? 3 : 5}
          placeholder="Recordatorios o notas importantes para este permiso..."
          className={`${FIELD_INPUT} min-h-[80px] resize-y`}
        />
        <p className="mt-1 text-right text-[10px] text-fg-faint">
          {draft.length}/{MAX_PERMISO_COMENTARIOS_LENGTH}
        </p>
      </div>

      {error && <div className={ALERT_ERROR}>{error}</div>}

      {saved && <div className={ALERT_SUCCESS}>Notas guardadas correctamente.</div>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        {(hasNotas || draft.trim()) && (
          <Button size="sm" variant="secondary" onClick={handleClear} disabled={saving}>
            Limpiar
          </Button>
        )}
      </div>

      {!compact && hasNotas && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-faint">
            Vista previa (lectura)
          </p>
          {readOnlyBlock}
        </div>
      )}
    </div>
  )
}

export function PermisoNotasIndicator({ comentarios }: { comentarios?: string | null }) {
  const hasNotas = Boolean(comentarios?.trim())
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
        hasNotas ? 'text-amber-700' : 'text-amber-500'
      }`}
      title={hasNotas ? 'Tiene notas' : 'Sin notas'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
      {hasNotas ? 'Ver notas' : 'Notas'}
    </span>
  )
}
