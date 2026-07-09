interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** When true, only renders the actions row (for nested configuración sections). */
  compact?: boolean
}

export default function PageHeader({ eyebrow, title, subtitle, actions, compact }: PageHeaderProps) {
  if (compact) {
    if (!actions) return null
    return (
      <div className="mb-5 flex justify-end">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">{actions}</div>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-[1.65rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">{actions}</div> : null}
    </div>
  )
}
