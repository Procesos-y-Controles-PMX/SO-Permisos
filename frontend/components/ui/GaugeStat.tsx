'use client'

import Link from 'next/link'

type Tone = 'default' | 'ok' | 'warn' | 'crit' | 'steel'

const TONE: Record<Tone, { value: string; fill: string; label: string }> = {
  default: { value: 'text-slate-900', fill: 'bg-slate-400', label: 'text-slate-600' },
  ok: { value: 'text-status-ok', fill: 'bg-status-ok', label: 'text-status-ok' },
  warn: { value: 'text-status-warn', fill: 'bg-status-warn', label: 'text-status-warn' },
  crit: { value: 'text-brand', fill: 'bg-brand', label: 'text-brand' },
  steel: { value: 'text-steel', fill: 'bg-steel', label: 'text-steel' },
}

export interface GaugeStatProps {
  label: string
  value: React.ReactNode
  unit?: string
  tone?: Tone
  proportion?: number
  sublabel?: React.ReactNode
  ticks?: number
  href?: string
  className?: string
  density?: 'default' | 'compact' | 'mini'
}

function TickMeter({
  proportion,
  fill,
  ticks,
  size = 'default',
}: {
  proportion: number
  fill: string
  ticks: number
  size?: 'default' | 'compact' | 'mini'
}) {
  const p = Math.max(0, Math.min(1, proportion))
  const filled = Math.round(p * ticks)
  const mt = size === 'mini' ? 'mt-1.5' : size === 'compact' ? 'mt-2' : 'mt-3'
  const barH = size === 'mini' ? 'h-2' : 'h-3'
  const majorH = size === 'mini' ? 'h-2' : 'h-3'
  const minorH = size === 'mini' ? 'h-1.5' : 'h-2'
  return (
    <div
      className={`flex ${barH} items-end gap-[2px] ${mt}`}
      role="meter"
      aria-valuenow={Math.round(p * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: ticks }).map((_, i) => {
        const major = i % 5 === 0
        const on = i < filled
        return (
          <span
            key={i}
            className={`w-px rounded-full ${major ? majorH : minorH} ${on ? fill : 'bg-slate-200'}`}
          />
        )
      })}
    </div>
  )
}

export default function GaugeStat({
  label,
  value,
  unit,
  tone = 'default',
  proportion,
  sublabel,
  ticks = 28,
  href,
  className = '',
  density = 'default',
}: GaugeStatProps) {
  const t = TONE[tone]
  const isCompact = density === 'compact'
  const isMini = density === 'mini'
  const tickSize = isMini ? 'mini' : isCompact ? 'compact' : 'default'

  const valueSize = isMini
    ? 'text-3xl font-bold'
    : isCompact
      ? 'text-5xl font-bold'
      : 'text-5xl font-semibold'

  const readout = (
    <>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-display leading-none tabular-nums tracking-tight ${t.value} ${valueSize}`}
        >
          {value}
        </span>
        {unit ? (
          <span className={`font-mono font-medium text-slate-400 ${isMini ? 'text-[10px]' : 'text-xs'}`}>
            {unit}
          </span>
        ) : null}
      </div>
      {typeof proportion === 'number' ? (
        <TickMeter
          proportion={proportion}
          fill={t.fill}
          ticks={isMini ? 14 : isCompact ? 20 : ticks}
          size={tickSize}
        />
      ) : null}
      {sublabel ? (
        <p
          className={`font-mono leading-snug ${
            isMini
              ? 'mt-1.5 text-[9px] text-slate-500'
              : isCompact
                ? 'mt-2 text-[10px] text-slate-600'
                : 'mt-3 text-[11px] leading-relaxed text-slate-400'
          }`}
        >
          {sublabel}
        </p>
      ) : null}
    </>
  )

  const body = (
    <div className={`flex flex-col ${isCompact || isMini ? '' : 'h-full'}`}>
      <p
        className={`font-bold uppercase tracking-[0.12em] ${
          isMini
            ? `text-[11px] ${t.label}`
            : isCompact
              ? `text-sm ${t.label}`
              : 'font-mono text-[11px] font-medium text-slate-400 tracking-[0.18em]'
        }`}
      >
        {label}
      </p>
      <div className={isMini ? 'mt-1.5' : isCompact ? 'mt-2.5' : 'mt-auto pt-10'}>{readout}</div>
    </div>
  )

  const base = isMini
    ? 'min-w-0 flex-1 px-3 py-3'
    : isCompact
      ? 'min-w-0 flex-1 px-5 py-4'
      : 'min-w-0 flex-1 p-6'

  if (href) {
    return (
      <Link href={href} className={`${base} block transition-colors hover:bg-slate-50/70 ${className}`}>
        {body}
      </Link>
    )
  }

  return <div className={`${base} ${className}`}>{body}</div>
}

/** Shared instrument panel — one flush surface with hairline dividers (Equipo-Móvil pattern). */
export function GaugeStatRow({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] divide-y divide-slate-100 sm:flex-row sm:divide-x sm:divide-y-0 ${className}`}
    >
      {children}
    </div>
  )
}

/** Multi-cell gauge grid inside one instrument panel. */
export function GaugeStatGrid({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-slate-200 bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 ${className}`}
    >
      {children}
    </div>
  )
}

export function complianceTone(percentage: number): Tone {
  if (percentage < 50) return 'crit'
  if (percentage < 85) return 'warn'
  return 'ok'
}
