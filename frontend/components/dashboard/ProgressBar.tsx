'use client'

interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ percentage, showLabel = true, className = "" }: ProgressBarProps) {
  const rounded = Math.min(100, Math.max(0, percentage))
  
  // Dynamic color selection
  const getColorClass = () => {
    if (rounded < 50) return 'bg-red-500 shadow-red-500/20'
    if (rounded < 85) return 'bg-orange-500 shadow-orange-500/20'
    return 'bg-green-500 shadow-green-500/20'
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-gray-500">Nivel de Cumplimiento</span>
          <span className={`text-lg font-bold tabular-nums ${
            rounded < 50 ? 'text-red-600' : rounded < 85 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getColorClass()}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}
