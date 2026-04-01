export interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-100/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── Stat Card variant (matches reference design) ───

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  sublabel?: string
  accentColor?: 'blue' | 'green' | 'red' | 'orange'
}

const accentMap = {
  blue:   { bg: 'bg-blue-50',   iconBg: 'bg-blue-100', iconText: 'text-blue-500',   underline: 'bg-blue-400' },
  green:  { bg: 'bg-green-50',  iconBg: 'bg-green-100', iconText: 'text-green-500',  underline: 'bg-green-400' },
  red:    { bg: 'bg-red-50',    iconBg: 'bg-red-100',   iconText: 'text-red-500',    underline: 'bg-red-400' },
  orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-500', underline: 'bg-orange-400' },
}

export function StatCard({ icon, value, label, sublabel, accentColor = 'blue' }: StatCardProps) {
  const colors = accentMap[accentColor]
  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col gap-4">
        {/* Icon with colored circle background */}
        <div className={`w-11 h-11 rounded-full ${colors.iconBg} ${colors.iconText} flex items-center justify-center`}>
          {icon}
        </div>

        {/* Label above value */}
        <div>
          <p className="text-[13px] text-gray-500 mb-1">{label}</p>
          <p className="text-[28px] font-bold text-slate-800 leading-none tracking-tight">{value}</p>
          {sublabel && (
            <p className="text-[12px] text-gray-400 mt-1.5">{sublabel}</p>
          )}
        </div>

        {/* Colored underline bar */}
        <div className={`h-[3px] w-10 rounded-full ${colors.underline}`} />
      </div>
    </Card>
  )
}
