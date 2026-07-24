import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-fg-subtle"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full min-h-12 rounded-sm border border-line bg-muted px-4 py-2.5 text-base text-fg
          placeholder:text-fg-faint
          transition-all duration-200
          focus:border-brand focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/15
          md:min-h-0 md:py-2.5 md:text-sm
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
