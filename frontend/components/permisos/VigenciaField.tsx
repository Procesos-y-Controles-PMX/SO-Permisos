'use client'

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
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={sinVencimiento}
          onChange={(e) => handleSinVencimientoChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500/30"
        />
        <span className="text-[13px] text-slate-700 group-hover:text-slate-900">
          Sin fecha de vencimiento
          <span className="block text-[11px] text-gray-400 font-normal mt-0.5">
            El permiso permanece vigente hasta que un administrador lo elimine.
          </span>
        </span>
      </label>

      {!sinVencimiento && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            {dateLabel}
          </label>
          <input
            type="date"
            value={vigencia}
            onChange={(e) => onVigenciaChange(e.target.value)}
            min={todayStr}
            required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-slate-700
              focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>
      )}
    </div>
  )
}
