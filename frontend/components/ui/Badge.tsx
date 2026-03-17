type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

// Helper to map permit/solicitud status to badge variant
export function statusToBadgeVariant(estatus: string): BadgeVariant {
  switch (estatus) {
    case 'Vigente':
    case 'Aprobado':
      return 'success'
    case 'Vencido':
    case 'Rechazado':
      return 'danger'
    case 'Pendiente':
    case 'Por Vencer':
      return 'warning'
    default:
      return 'neutral'
  }
}
