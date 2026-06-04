'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
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
    <div
      className={`rounded-lg border ${
        hasNotas ? 'bg-slate-50 border-slate-200' : 'bg-gray-50/50 border-gray-100'
      } ${compact ? 'p-2.5' : 'p-3'}`}
    >
      {hasNotas ? (
        <p
          className={`text-slate-700 leading-relaxed whitespace-pre-wrap ${
            compact ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          {comentarios}
        </p>
      ) : (
        <p className={`text-gray-400 italic ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
          Sin notas registradas
        </p>
      )}
    </div>
  )

  if (!canEdit) {
    return (
      <div className={compact ? 'mt-3' : 'space-y-2'}>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Notas del permiso
        </p>
        {readOnlyBlock}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {nombrePermiso && (
        <p className="text-[12px] text-gray-500">
          Permiso: <span className="font-medium text-slate-700">{nombrePermiso}</span>
        </p>
      )}

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Notas del permiso
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_PERMISO_COMENTARIOS_LENGTH}
          rows={compact ? 3 : 5}
          placeholder="Recordatorios o notas importantes para este permiso..."
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-slate-700
            focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-y min-h-[80px]"
        />
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          {draft.length}/{MAX_PERMISO_COMENTARIOS_LENGTH}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Notas guardadas correctamente.
        </p>
      )}

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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
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
        hasNotas ? 'text-amber-700' : 'text-gray-400'
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
