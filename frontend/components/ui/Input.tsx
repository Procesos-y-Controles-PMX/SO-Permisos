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
          neu-field w-full min-h-12 rounded-sm px-4 py-2.5 text-base text-fg
          placeholder:text-fg-faint focus:outline-none
          md:min-h-0 md:py-2.5 md:text-sm
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
