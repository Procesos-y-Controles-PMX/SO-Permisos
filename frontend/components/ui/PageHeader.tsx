import { ThemeToggle } from "@promexma/ui"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** When true, only renders the actions row (for nested configuración sections). */
  compact?: boolean
  /** Show the light/dark toggle in the actions row. Prefer sidebar GridThemeToggle; default off. */
  showThemeToggle?: boolean
}

export default function PageHeader({ eyebrow, title, subtitle, actions, compact, showThemeToggle = false }: PageHeaderProps) {
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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg md:text-[1.65rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-fg-subtle">{subtitle}</p> : null}
      </div>
      {actions || showThemeToggle ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
          {showThemeToggle ? <ThemeToggle /> : null}
        </div>
      ) : null}
    </div>
  )
}
