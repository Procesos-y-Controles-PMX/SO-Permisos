'use client'

interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ percentage, showLabel = true, className = '' }: ProgressBarProps) {
  const rounded = Math.min(100, Math.max(0, percentage))

  const getColorClass = () => {
    if (rounded < 50) return 'bg-red-500 shadow-red-500/20'
    if (rounded < 85) return 'bg-orange-500 shadow-orange-500/20'
    return 'bg-green-500 shadow-green-500/20'
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-medium text-fg-subtle">Nivel de Cumplimiento</span>
          <span
            className={`text-lg font-bold tabular-nums ${
              rounded < 50 ? 'text-red-600' : rounded < 85 ? 'text-orange-600' : 'text-green-600'
            }`}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted-strong shadow-inner">
        <div
          className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${getColorClass()}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}
