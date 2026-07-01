'use client'

import { FIELD_INPUT } from '@/components/ui/contentStyles'
import { getTodayDateString } from '@/lib/vigencia'

interface VigenciaFieldProps {
  vigencia: string
  sinVencimiento: boolean
  onVigenciaChange: (value: string) => void
  onSinVencimientoChange: (value: boolean) => void
  dateLabel?: string
  className?: string
}

export default function VigenciaField({
  vigencia,
  sinVencimiento,
  onVigenciaChange,
  onSinVencimientoChange,
  dateLabel = 'Fecha de vigencia propuesta',
  className = '',
}: VigenciaFieldProps) {
  const todayStr = getTodayDateString()

  const handleSinVencimientoChange = (checked: boolean) => {
    onSinVencimientoChange(checked)
    if (checked) {
      onVigenciaChange('')
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="group flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={sinVencimiento}
          onChange={(e) => handleSinVencimientoChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-brand focus:ring-brand/15"
        />
        <span className="text-[13px] text-slate-700 group-hover:text-slate-900">
          Sin fecha de vencimiento
          <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
            El permiso permanece vigente hasta que un administrador lo elimine.
          </span>
        </span>
      </label>

      {!sinVencimiento && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {dateLabel}
          </label>
          <input
            type="date"
            value={vigencia}
            onChange={(e) => onVigenciaChange(e.target.value)}
            min={todayStr}
            required
            className={FIELD_INPUT}
          />
        </div>
      )}
    </div>
  )
}
